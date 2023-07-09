// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true
  internalEvents: {
    '': { type: '' }
    'done.invoke.copyAndTransform': {
      type: 'done.invoke.copyAndTransform'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'done.invoke.runNextPendingMigration': {
      type: 'done.invoke.runNextPendingMigration'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'error.platform.copyAndTransform': {
      type: 'error.platform.copyAndTransform'
      data: unknown
    }
    'error.platform.runNextPendingMigration': {
      type: 'error.platform.runNextPendingMigration'
      data: unknown
    }
    'xstate.init': { type: 'xstate.init' }
  }
  invokeSrcNameMap: {
    copyAndTransform: 'done.invoke.copyAndTransform'
    runNextPendingMigration: 'done.invoke.runNextPendingMigration'
  }
  missingImplementations: {
    actions:
      | 'checkPendingMigrations'
      | 'deleteShadowDb'
      | 'escalateError'
      | 'renameSchemaDbToShadow'
      | 'updateUserVersion'
    delays: never
    guards: 'hasNextPendingMigration'
    services: 'copyAndTransform' | 'runNextPendingMigration'
  }
  eventsCausingActions: {
    checkPendingMigrations: ''
    deleteShadowDb: ''
    escalateError:
      | 'error.platform.copyAndTransform'
      | 'error.platform.runNextPendingMigration'
    renameSchemaDbToShadow: ''
    updateUserVersion: 'done.invoke.copyAndTransform'
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {
    hasNextPendingMigration: ''
  }
  eventsCausingServices: {
    copyAndTransform: 'done.invoke.runNextPendingMigration'
    runNextPendingMigration: ''
  }
  matchesStates:
    | 'check next migration'
    | 'copy & transform data'
    | 'create schema db'
    | 'delete shadow db'
    | 'done'
    | 'error'
    | 'rename schema db to shadow db'
    | 'run next pending migration'
    | 'schema db migrated'
  tags: never
}
