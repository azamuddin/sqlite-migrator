import {assign} from '@xstate/immer';
import fs from 'fs';
import {sql} from 'kysely';
import {createMachine} from 'xstate';
import {executeMigrationMachine} from './execute-migration/machine';
import {createSqliteKysely} from '../utils/sqlite-factory';

type MigrationMachineContext = {
  dbPath: string;
  dbExist: boolean;
  latestVersion: number | null;
  userVersion: number | null;
  schemaVersion: number | null;
};

type MigrationMachineServiceMap = {
  getUserVersion: {
    data: number;
  };
  runFreshMigration: {
    data: any;
  };
};

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
      dbExist: false,
      latestVersion: null,
      userVersion: null,
      schemaVersion: null,
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
      assignDatabaseExist: assign(context => {
        console.log('migrationMachine.actions.assignDatabaseExist');
        context.dbExist = fs.existsSync(context.dbPath);
      }),
      assignUserVersion: assign((context, event) => {
        context.userVersion = event.data;
      }),
    },
    services: {
      getUserVersion: async context => {
        const db = createSqliteKysely(context.dbPath);
        const result = await sql<{
          user_version: number;
        }>`PRAGMA user_version`.execute(db);
        console.log('MIGRATION ACTOR.services.getUserVersion', result.rows);
        return result.rows?.[0]?.user_version;
      },
      executeMigrationMachine,
      runFreshMigration: async () => {
        // TODO
      },
    },
    guards: {
      hasNextPendingMigration: () => {
        return false;
      },
      databaseExists: context => context.dbExist,
    },
  },
);
