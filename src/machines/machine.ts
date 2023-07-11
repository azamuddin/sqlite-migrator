import { assign } from '@xstate/immer'
import fs from 'fs'
import { sql } from 'kysely'
import { createMachine } from 'xstate'
import { executeMigrationMachine } from './execute-migration/machine'
import { createDB } from '../utils/sqlite-factory'
import { logger } from '../utils/logger'
import { getLatestMigration, runFreshMigration } from '../shared/migrations'
import Sqlite from 'better-sqlite3'

export type MigrationMachineContext = {
  dbPath: string
  debug: boolean
  migrationDir: string
  _dbExist: boolean
  _latestVersion: number
  _userVersion: number
}

export type MigrationMachineServiceMap = {
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
      _userVersion: 0,
      _latestVersion: 1,
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
    initial: 'initial',
    states: {
      initial: {
        entry: ['assignDatabaseExist', 'assignLatestVersion'],
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
            target: 'run pending migration',
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
              target: 'update user version',
            },
          ],
          onError: [
            {
              target: 'migration failed',
            },
          ],
        },
      },
      'update user version': {
        entry: ['updateUserVersion'],
        always: {
          target: 'done',
        },
      },
      'run pending migration': {
        invoke: {
          src: executeMigrationMachine,
          id: 'executeMigrationMachine',
          data: (context) => context,
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
        const exists = fs.existsSync(context.dbPath)
        logger.debug('migrationMachine.actions.assignDatabaseExist', exists)
        context._dbExist = exists
      }),
      assignLatestVersion: assign((context) => {
        context._latestVersion = getLatestMigration(context.migrationDir)
      }),
      assignUserVersion: assign((context, event) => {
        logger.debug('migrationMachine.actions.assignUserVersion', event.data)
        context._userVersion = event.data
      }),
      updateUserVersion: assign(async (context) => {
        logger.debug('migrationMachine.actions.updateUserVersion')
        const db = new Sqlite(context.dbPath)
        const latest = getLatestMigration(context.migrationDir)
        db.exec(`PRAGMA user_version = ${latest}`)
      }),
    },
    services: {
      getUserVersion: async (context) => {
        const db = createDB(context.dbPath)
        const result = await sql<{
          user_version: number
        }>`PRAGMA user_version`.execute(db)
        logger.debug('MIGRATION ACTOR.services.getUserVersion', result.rows)
        return result.rows?.[0]?.user_version
      },
      executeMigrationMachine,
      runFreshMigration: runFreshMigration(async (migration, db) => {
        await migration.up(db)
      }),
    },
    guards: {
      hasNextPendingMigration: (context) => {
        logger.debug(
          'migrationMachine.guards.hasNextPendingMigration',
          context._userVersion,
          context._latestVersion,
        )
        return context._userVersion < context._latestVersion
      },
      databaseExists: (context) => context._dbExist,
    },
  },
)
