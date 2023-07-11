import { dirname, resolve } from 'path'
import { existsSync, unlinkSync } from 'fs'

import { createMachine } from 'xstate'
import { Kysely, sql } from 'kysely'
import { assign } from '@xstate/immer'
import { escalate } from 'xstate/lib/actions'
import Sqlite from 'better-sqlite3'

import { MigrationMachineContext } from '../machine'
import { createDB } from '../../utils/sqlite-factory'
import { Migration } from '../../types'
import { getMigrations } from '../../shared/migrations'
import { asyncForEach } from '../../utils/async-foreach'
import { logger } from '../../utils/logger'
import { renameDatabase } from '../../shared/copy-database'

const copyAndTransform = (
  runner: (
    migration: Migration,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    source: Kysely<any>,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: Kysely<any>,
  ) => Promise<void>,
) => {
  return async (context: RunPendingMigrationContext) => {
    const migrationFiles = getMigrations(
      context.migrationDir,
      context._schemaVersion + 1,
    )
    await asyncForEach(migrationFiles, async (fileName) => {
      const migration = await import(
        resolve(
          context.migrationDir,
          (context._schemaVersion + 1).toString(),
          fileName,
        )
      )
      const source = createDB(resolve(dirname(context.dbPath), 'shadow.sqlite'))
      runner(migration.default, source, context._schemaDB)
    })
  }
}

const runNextPendingMigration = (
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  runner: (migration: Migration, db: Kysely<any>) => Promise<void>,
) => {
  return async (context: RunPendingMigrationContext) => {
    logger.debug('runNextPendingMigration', context._schemaVersion + 1)
    const migrationFiles = getMigrations(
      context.migrationDir,
      context._schemaVersion + 1,
    )
    await asyncForEach(migrationFiles, async (fileName) => {
      const migration = await import(
        resolve(
          context.migrationDir,
          (context._schemaVersion + 1).toString(),
          fileName,
        )
      )
      runner(migration.default, context._schemaDB)
    })
  }
}

type RunPendingMigrationContext = Pick<
  MigrationMachineContext,
  'dbPath' | 'migrationDir' | '_latestVersion'
> & {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  _schemaDB: Kysely<any>
  _schemaVersion: number
}

type RunPendingMigrationServiceMap = {
  getSchemaVersion: {
    data: number
  }
}

export const runPendingMigrationMachine = createMachine(
  {
    id: 'run-pending-migrations-machine',
    tsTypes: {} as import('./machine.typegen').Typegen0,
    schema: {
      context: {} as RunPendingMigrationContext,
      services: {} as RunPendingMigrationServiceMap,
    },
    context: {} as RunPendingMigrationContext,
    predictableActionArguments: true,
    preserveActionOrder: true,
    initial: 'create schema db',
    states: {
      'create schema db': {
        entry: ['createSchemaDB'],
        always: {
          target: 'assign schema version',
        },
      },
      'assign schema version': {
        invoke: {
          src: 'getSchemaVersion',
          id: 'getSchemaVersion',
          onDone: {
            target: 'copy structure only',
            actions: ['assignSchemaVersion'],
          },
          onError: {
            target: 'error',
          },
        },
      },
      'copy structure only': {
        description: 'Copy structure from shadow.db to schema.db',
        invoke: {
          id: 'copyStructure',
          src: 'copyStructure',
          onDone: {
            target: 'run next pending migration',
          },
          onError: {
            target: 'error',
          },
        },
      },
      'run next pending migration': {
        invoke: {
          src: 'runNextPendingMigration',
          id: 'runNextPendingMigration',
          onDone: [
            {
              target: 'copy & transform data',
            },
          ],
          onError: [
            {
              target: 'error',
            },
          ],
        },
      },
      'copy & transform data': {
        invoke: {
          src: 'copyAndTransform',
          id: 'copyAndTransform',
          onDone: [
            {
              target: 'schema db migrated',
            },
          ],
          onError: [
            {
              target: 'error',
            },
          ],
        },
      },
      'schema db migrated': {
        invoke: {
          src: 'incrementSchemaDBUserVersion',
          id: 'incrementSchemaDBUserVersion',
          onDone: {
            target: 'delete shadow db',
            actions: ['incrementContextSchemaVersion'],
          },
          onError: {
            target: 'error',
          },
        },
      },
      'check next migration': {
        always: [
          {
            target: 'create schema db',
            cond: 'hasNextPendingMigration',
          },
          {
            target: 'done',
          },
        ],
      },
      done: {
        type: 'final',
      },
      'delete shadow db': {
        entry: 'deleteShadowDb',
        always: {
          target: 'rename schema db to shadow db',
        },
      },
      'rename schema db to shadow db': {
        entry: 'renameSchemaDbToShadow',
        always: {
          target: 'check next migration',
        },
      },
      error: {
        entry: 'escalateError',
      },
    },
  },
  {
    actions: {
      createSchemaDB: assign((context) => {
        const schemaPath = resolve(dirname(context.dbPath), 'schema.sqlite')
        context._schemaDB = createDB(schemaPath)
      }),
      assignSchemaVersion: assign((context, event) => {
        context._schemaVersion = event.data
      }),
      deleteShadowDb: (context) => {
        logger.debug('runPendingMigrationMachine.actions.deleteShadowDb')
        const shadowDBPath = resolve(dirname(context.dbPath), 'shadow.sqlite')
        const shadowSHM = resolve(dirname(context.dbPath), 'shadow.sqlite-shm')
        const shadowWAL = resolve(dirname(context.dbPath), 'shadow.sqlite-wal')
        const paths = [shadowDBPath, shadowSHM, shadowWAL]
        paths.forEach((path) => {
          if (existsSync(path)) {
            unlinkSync(path)
          }
        })
      },
      escalateError: escalate({ message: 'Run Pending Migration Failed' }),
      renameSchemaDbToShadow: (context) => {
        logger.debug(
          'runPendingMigrationMachine.actions.renameSchemaDbToShadow',
        )
        const basePath = dirname(context.dbPath)
        renameDatabase(resolve(basePath, 'schema.sqlite'), 'shadow.sqlite')
      },
      incrementContextSchemaVersion: assign((context) => {
        context._schemaVersion = context._schemaVersion + 1
      }),
    },
    services: {
      copyStructure: async (context) => {
        logger.debug(context._schemaVersion, 'THE SCHEMA VERSION')
        await asyncForEach(
          Array.from({ length: context._schemaVersion }).map(
            (_, index) => index + 1,
          ),
          async (version) => {
            const migrationFiles = getMigrations(context.migrationDir, version)
            await asyncForEach(migrationFiles, async (fileName) => {
              const migration = await import(
                resolve(context.migrationDir, version.toString(), fileName)
              )
              await migration.default.up(context._schemaDB)
            })
          },
        )
      },
      getSchemaVersion: async (context) => {
        const shadowDB = createDB(
          resolve(dirname(context.dbPath), 'shadow.sqlite'),
        )
        const currentVersion = await sql<{
          user_version: number
        }>`PRAGMA user_version`.execute(shadowDB)
        return currentVersion.rows[0].user_version
      },
      runNextPendingMigration: runNextPendingMigration(
        async (migration, db) => {
          logger.debug(
            'runPendingMigrationMachine.services.runNextPendingMigration',
          )
          await migration.up(db)
        },
      ),
      copyAndTransform: copyAndTransform(async (migration, source, db) => {
        logger.debug('runPendingMigrationMachine.services.copyAndTransform')
        await migration.transform(source, db)
      }),
      incrementSchemaDBUserVersion: async (context) => {
        const sqlite = new Sqlite(
          resolve(dirname(context.dbPath), 'schema.sqlite'),
        )
        sqlite.exec(`PRAGMA user_version = ${context._schemaVersion + 1}`)
      },
    },
    guards: {
      hasNextPendingMigration: (context) => {
        return context._latestVersion > context._schemaVersion
      },
    },
  },
)
