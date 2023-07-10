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
    'done.invoke.copyStructure': {
      type: 'done.invoke.copyStructure'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'done.invoke.getSchemaVersion': {
      type: 'done.invoke.getSchemaVersion'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'done.invoke.incrementSchemaDBUserVersion': {
      type: 'done.invoke.incrementSchemaDBUserVersion'
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
    'error.platform.copyStructure': {
      type: 'error.platform.copyStructure'
      data: unknown
    }
    'error.platform.getSchemaVersion': {
      type: 'error.platform.getSchemaVersion'
      data: unknown
    }
    'error.platform.incrementSchemaDBUserVersion': {
      type: 'error.platform.incrementSchemaDBUserVersion'
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
    copyStructure: 'done.invoke.copyStructure'
    getSchemaVersion: 'done.invoke.getSchemaVersion'
    incrementSchemaDBUserVersion: 'done.invoke.incrementSchemaDBUserVersion'
    runNextPendingMigration: 'done.invoke.runNextPendingMigration'
  }
  missingImplementations: {
    actions: never
    delays: never
    guards: never
    services: never
  }
  eventsCausingActions: {
    assignSchemaVersion: 'done.invoke.getSchemaVersion'
    createSchemaDB: '' | 'xstate.init'
    deleteShadowDb: 'done.invoke.incrementSchemaDBUserVersion'
    escalateError:
      | 'error.platform.copyAndTransform'
      | 'error.platform.copyStructure'
      | 'error.platform.getSchemaVersion'
      | 'error.platform.incrementSchemaDBUserVersion'
      | 'error.platform.runNextPendingMigration'
    incrementContextSchemaVersion: 'done.invoke.incrementSchemaDBUserVersion'
    renameSchemaDbToShadow: ''
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {
    hasNextPendingMigration: ''
  }
  eventsCausingServices: {
    copyAndTransform: 'done.invoke.runNextPendingMigration'
    copyStructure: 'done.invoke.getSchemaVersion'
    getSchemaVersion: ''
    incrementSchemaDBUserVersion: 'done.invoke.copyAndTransform'
    runNextPendingMigration: 'done.invoke.copyStructure'
  }
  matchesStates:
    | 'assign schema version'
    | 'check next migration'
    | 'copy & transform data'
    | 'copy structure only'
    | 'create schema db'
    | 'delete shadow db'
    | 'done'
    | 'error'
    | 'rename schema db to shadow db'
    | 'run next pending migration'
    | 'schema db migrated'
  tags: never
}
