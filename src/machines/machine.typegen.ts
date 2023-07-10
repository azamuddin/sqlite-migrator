// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true
  internalEvents: {
    '': { type: '' }
    'done.invoke.getUserVersion': {
      type: 'done.invoke.getUserVersion'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'done.invoke.runFreshMigration': {
      type: 'done.invoke.runFreshMigration'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'error.platform.getUserVersion': {
      type: 'error.platform.getUserVersion'
      data: unknown
    }
    'error.platform.runFreshMigration': {
      type: 'error.platform.runFreshMigration'
      data: unknown
    }
    'xstate.init': { type: 'xstate.init' }
  }
  invokeSrcNameMap: {
    getUserVersion: 'done.invoke.getUserVersion'
    runFreshMigration: 'done.invoke.runFreshMigration'
  }
  missingImplementations: {
    actions: never
    delays: never
    guards: never
    services: never
  }
  eventsCausingActions: {
    assignDatabaseExist: 'xstate.init'
    assignLatestVersion: 'xstate.init'
    assignUserVersion: 'done.invoke.getUserVersion'
    updateUserVersion: 'done.invoke.runFreshMigration'
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {
    databaseExists: ''
    hasNextPendingMigration: ''
  }
  eventsCausingServices: {
    executeMigrationMachine: ''
    getUserVersion: ''
    runFreshMigration: ''
  }
  matchesStates:
    | 'check database exist'
    | 'compare user version'
    | 'done'
    | 'get user version'
    | 'initial'
    | 'migration failed'
    | 'run fresh migration'
    | 'run pending migration'
    | 'update user version'
  tags: never
}
