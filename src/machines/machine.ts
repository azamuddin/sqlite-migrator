import { assign } from '@xstate/immer'
import fs from 'fs'
import { sql } from 'kysely'
import { createMachine } from 'xstate'
import { executeMigrationMachine } from './execute-migration/machine'
import { createDB } from '../utils/sqlite-factory'
import { logger } from '../utils/logger'
import { runFreshMigration } from '../shared/run-fresh-migration'

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
        const db = createDB(context.dbPath)
        const result = await sql<{
          user_version: number
        }>`PRAGMA user_version`.execute(db)
        logger.info('MIGRATION ACTOR.services.getUserVersion', result.rows)
        return result.rows?.[0]?.user_version
      },
      executeMigrationMachine,
      runFreshMigration: runFreshMigration(
        async (migration, db) => await migration.up(db),
      ),
    },
    guards: {
      hasNextPendingMigration: () => {
        return false
      },
      databaseExists: (context) => context._dbExist,
    },
  },
)
