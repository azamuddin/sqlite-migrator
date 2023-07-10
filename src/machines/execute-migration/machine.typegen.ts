// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true
  internalEvents: {
    '': { type: '' }
    'done.invoke.createShadowDB': {
      type: 'done.invoke.createShadowDB'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'done.invoke.runPendingMigrationMachine': {
      type: 'done.invoke.runPendingMigrationMachine'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'error.platform.createShadowDB': {
      type: 'error.platform.createShadowDB'
      data: unknown
    }
    'error.platform.runPendingMigrationMachine': {
      type: 'error.platform.runPendingMigrationMachine'
      data: unknown
    }
    'xstate.init': { type: 'xstate.init' }
  }
  invokeSrcNameMap: {
    createShadowDB: 'done.invoke.createShadowDB'
  }
  missingImplementations: {
    actions: never
    delays: never
    guards: never
    services: 'runPendingMigrationMachine'
  }
  eventsCausingActions: {
    deleteOriginalBAK: ''
    deleteSchemaDB: ''
    deleteShadowDB: 'error.platform.runPendingMigrationMachine'
    escalateError:
      | 'done.state.execute-migration-machine.cancelling'
      | 'error.platform.createShadowDB'
    renameOriginalDBToBAK: 'done.invoke.runPendingMigrationMachine'
    renameShadowDBToDatabase: ''
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {}
  eventsCausingServices: {
    createShadowDB: 'xstate.init'
    runPendingMigrationMachine: 'done.invoke.createShadowDB'
  }
  matchesStates:
    | 'cancelling'
    | 'cancelling.delete schema db'
    | 'cancelling.delete shadow db'
    | 'cancelling.done'
    | 'committing'
    | 'committing.delete original bak'
    | 'committing.done'
    | 'committing.original db migrated'
    | 'committing.rename original db to original bak'
    | 'committing.rename shadow db to original db'
    | 'creating shadow db'
    | 'error'
    | 'migration success'
    | 'running pending migrations'
    | {
        cancelling?: 'delete schema db' | 'delete shadow db' | 'done'
        committing?:
          | 'delete original bak'
          | 'done'
          | 'original db migrated'
          | 'rename original db to original bak'
          | 'rename shadow db to original db'
      }
  tags: never
}
