import path, { dirname, resolve } from 'path'
import { unlinkSync } from 'fs'

import { createMachine } from 'xstate'
import { Kysely } from 'kysely'
import { escalate } from 'xstate/lib/actions'

import { createDB } from '../../utils/sqlite-factory'
import { runPendingMigrationMachine } from '../run-pending-migration/machine'
import { MigrationMachineContext } from '../machine'
import { copyDatabase, renameDatabase } from '../../shared/copy-database'


export type ExecuteMigrationMachineContext = MigrationMachineContext & {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  _shadowDB: Kysely<any>
}

export const executeMigrationMachine = createMachine(
  {
    id: 'execute-migration-machine',
    tsTypes: {} as import('./machine.typegen').Typegen0,
    schema: {
      context: {} as ExecuteMigrationMachineContext,
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
    initial: 'creating shadow db',
    states: {
      'creating shadow db': {
        invoke: {
          src: 'createShadowDB',
          id: 'createShadowDB',
          onDone: {
            target: 'running pending migrations',
          },
          onError: {
            target: 'error',
          },
        },
      },
      'running pending migrations': {
        invoke: {
          src: runPendingMigrationMachine,
          id: 'runPendingMigrationMachine',
          data: (context) => context,
          onDone: [
            {
              target: 'committing',
            },
          ],
          onError: [
            {
              target: 'cancelling',
            },
          ],
        },
      },
      committing: {
        initial: 'rename original db to original bak',
        states: {
          'rename original db to original bak': {
            entry: ['renameOriginalDBToBAK'],
            always: {
              target: 'rename shadow db to original db',
            },
          },
          'rename shadow db to original db': {
            entry: ['renameShadowDBToDatabase'],
            always: {
              target: 'original db migrated',
            },
          },
          'original db migrated': {
            always: {
              target: 'delete original bak',
            },
          },
          'delete original bak': {
            entry: ['deleteOriginalBAK'],
            always: {
              target: 'done',
            },
          },
          done: {
            type: 'final',
          },
        },
        onDone: {
          target: 'migration success',
        },
      },
      cancelling: {
        initial: 'delete shadow db',
        states: {
          'delete shadow db': {
            entry: ['deleteShadowDB'],
            always: {
              target: 'delete schema db',
            },
          },
          'delete schema db': {
            entry: ['deleteSchemaDB'],
            always: {
              target: 'done',
            },
          },
          done: {
            type: 'final',
          },
        },
        onDone: {
          target: 'error',
        },
      },
      'migration success': {
        type: 'final',
      },
      error: {
        entry: 'escalateError',
      },
    },
  },
  {
    actions: {
      renameOriginalDBToBAK: (context) => {
        renameDatabase(context.dbPath, 'original.bak.sqlite')
      },
      renameShadowDBToDatabase: (context) => {
        renameDatabase(
          resolve(dirname(context.dbPath), 'shadow.sqlite'),
          'database.sqlite',
        )
      },
      deleteOriginalBAK: (context) => {
        unlinkSync(resolve(dirname(context.dbPath), 'original.bak.sqlite'))
        unlinkSync(resolve(dirname(context.dbPath), 'original.bak.sqlite-shm'))
        unlinkSync(resolve(dirname(context.dbPath), 'original.bak.sqlite-wal'))
      },
      deleteShadowDB: (context) => {
        unlinkSync(resolve(dirname(context.dbPath), 'shadow.sqlite'))
        unlinkSync(resolve(dirname(context.dbPath), 'shadow.sqlite-shm'))
        unlinkSync(resolve(dirname(context.dbPath), 'shadow.sqlite-wal'))
      },
      deleteSchemaDB: (context) => {
        unlinkSync(resolve(dirname(context.dbPath), 'schema.sqlite'))
        unlinkSync(resolve(dirname(context.dbPath), 'schema.sqlite-shm'))
        unlinkSync(resolve(dirname(context.dbPath), 'schema.sqlite-wal'))
      },
      escalateError: escalate({ message: 'execute migration failed' }),
    },
    services: {
      createShadowDB: async (context) => {
        copyDatabase(context.dbPath, 'shadow.sqlite')
        context._shadowDB = createDB(
          path.resolve(dirname(context.dbPath), 'shadow.sqlite'),
        )
      },
    },
  },
)
