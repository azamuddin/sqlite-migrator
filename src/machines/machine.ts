import {assign} from '@xstate/immer';
import fs from 'fs';
import {sql} from 'kysely';
import {createMachine, interpret} from 'xstate';
import {executeMigrationMachine} from './execute-migration/machine';
import {createSqliteKysely} from '../utils/sqlite-factory';

type MigrationMachineContext = {
  db_path: string;
  db_exist: boolean;
  current_version: number | null;
  user_version: number | null;
  schema_version: number | null;
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
      db_path: '/database.db',
      db_exist: false,
      current_version: null,
      user_version: null,
      schema_version: null,
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
        context.db_exist = fs.existsSync(context.db_path);
      }),
      assignUserVersion: assign((context, event) => {
        context.user_version = event.data;
      }),
    },
    services: {
      getUserVersion: async context => {
        const db = createSqliteKysely(context.db_path);
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
      hasNextPendingMigration: context => {
        return false;
      },
      databaseExists: context => context.db_exist,
    },
  },
);

export const MigrationActor = interpret(migrationMachine).start();

MigrationActor.onTransition(state => {
  console.log('MIGRATION ACTOR value', state.value);
  console.log('MIGRATION ACTOR context', state.context);
});
MigrationActor.onEvent(event => {
  console.log('MIGRATION ACTOR events', event);
});
