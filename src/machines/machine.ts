import { assign } from '@xstate/immer'
import fs, { readdirSync } from 'fs'
import { Migrator, sql } from 'kysely'
import { createMachine } from 'xstate'
import { executeMigrationMachine } from './execute-migration/machine'
import { createSqliteKysely } from '../utils/sqlite-factory'
import { logger } from '../utils/logger'
import path from 'path'

export type MigrationMachineContext = {
  dbPath: string
  debug: boolean
  migrationDir: string
  _dbExist: boolean
  _latestVersion: number | null
  _schemaVersion: number | null
  _userVersion: number | null
}

type MigrationMachineServiceMap = {
  getUserVersion: {
    data: number
  }
  runFreshMigration: {
    data: boolean
  }
}

const getLatestMigration = (migrationDir: string): number => {
  const migrationVersions = readdirSync(migrationDir)
  const latestVersion = migrationVersions
    .map((version) => parseInt(version))
    .sort((a, b) => b - a)[0]
  return latestVersion
}

const getMigrations = (migrationDir: string, version: number) => {
  const latestDir = path.resolve(migrationDir, `${version}`)
  return readdirSync(latestDir)
}

const asyncForEach = async <T>(
  data: T[],
  predicate: (item: T) => Promise<void>,
) => {
  return await Promise.all(
    data.map((item) => {
      return new Promise(async (resolve) => resolve(await predicate(item)))
    }),
  )
}

// const migration = await import(
//   path.resolve(context.migrationDir, current.toString(), file)
// )
// await migration.up(db)
// resolve(true)

export const migrationMachine = createMachine(
  {
    id: 'migration-machine',
    schema: {
      context: {} as MigrationMachineContext,
      services: {} as MigrationMachineServiceMap,
    },
    tsTypes: {} as import('./machine.typegen').Typegen0,
    context: {
      dbPath: '/database.db',
      debug: false,
      migrationDir: '',
      _dbExist: false,
      _userVersion: null,
      _latestVersion: null,
      _schemaVersion: null,
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
    initial: 'initial',
    states: {
      initial: {
        entry: 'assignDatabaseExist',
        always: {
          target: 'check database exist',
        },
      },
      'check database exist': {
        always: [
          {
            target: 'get user version',
            cond: 'databaseExists',
          },
          {
            target: 'run fresh migration',
          },
        ],
      },
      'get user version': {
        invoke: {
          src: 'getUserVersion',
          id: 'getUserVersion',
          onDone: {
            target: 'compare user version',
            actions: ['assignUserVersion'],
          },
          onError: {
            target: 'migration failed',
          },
        },
      },
      'compare user version': {
        description: 'compare user version and latest app version',
        always: [
          {
            target: 'execute migration',
            cond: 'hasNextPendingMigration',
          },
          {
            target: 'done',
          },
        ],
      },
      'run fresh migration': {
        invoke: {
          src: 'runFreshMigration',
          id: 'runFreshMigration',
          onDone: [
            {
              target: 'done',
            },
          ],
          onError: [
            {
              target: 'migration failed',
            },
          ],
        },
      },
      'execute migration': {
        invoke: {
          src: executeMigrationMachine,
          id: 'executeMigrationMachine',
          onDone: [
            {
              target: 'done',
            },
          ],
          onError: [
            {
              target: 'migration failed',
            },
          ],
        },
      },
      done: {
        type: 'final',
      },
      'migration failed': {},
    },
  },
  {
    actions: {
      assignDatabaseExist: assign((context) => {
        logger.info('migrationMachine.actions.assignDatabaseExist')
        context._dbExist = fs.existsSync(context.dbPath)
      }),
      assignUserVersion: assign((context, event) => {
        context._userVersion = event.data
      }),
    },
    services: {
      getUserVersion: async (context) => {
        const db = createSqliteKysely(context.dbPath)
        const result = await sql<{
          user_version: number
        }>`PRAGMA user_version`.execute(db)
        logger.info('MIGRATION ACTOR.services.getUserVersion', result.rows)
        return result.rows?.[0]?.user_version
      },
      executeMigrationMachine,
      runFreshMigration: async (context): Promise<boolean> => {
        logger.debug(
          'migrationMachine.services.runFreshMigration',
          context.dbPath,
        )
        const db = createSqliteKysely(context.dbPath)
        const latest = getLatestMigration(context.migrationDir)
        await asyncForEach(
          Array.from({ length: latest }).map((_, index) => index + 1),
          async (version) => {
            logger.debug(`PROCESSING migration version ${version}`)
            const files = getMigrations(context.migrationDir, version)
            await asyncForEach(files, async (file) => {
              const migration = await import(
                path.resolve(context.migrationDir, version.toString(), file)
              )
              await migration.up(db)
            })
          },
        )
        logger.debug('DONE PROCESING all migrations')
        return true
      },
    },
    guards: {
      hasNextPendingMigration: () => {
        return false
      },
      databaseExists: (context) => context._dbExist,
    },
  },
)
