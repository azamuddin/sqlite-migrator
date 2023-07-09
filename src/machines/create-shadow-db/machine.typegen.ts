// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true
  internalEvents: {
    '': { type: '' }
    'done.invoke.copyOriginalData': {
      type: 'done.invoke.copyOriginalData'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'done.invoke.runCurrentMigration': {
      type: 'done.invoke.runCurrentMigration'
      data: unknown
      __tip: 'See the XState TS docs to learn how to strongly type this.'
    }
    'error.platform.copyOriginalData': {
      type: 'error.platform.copyOriginalData'
      data: unknown
    }
    'error.platform.runCurrentMigration': {
      type: 'error.platform.runCurrentMigration'
      data: unknown
    }
    'xstate.init': { type: 'xstate.init' }
  }
  invokeSrcNameMap: {
    copyOriginalData: 'done.invoke.copyOriginalData'
    runCurrentMigration: 'done.invoke.runCurrentMigration'
  }
  missingImplementations: {
    actions: 'escalateError'
    delays: never
    guards: never
    services: 'copyOriginalData' | 'runCurrentMigration'
  }
  eventsCausingActions: {
    escalateError:
      | 'error.platform.copyOriginalData'
      | 'error.platform.runCurrentMigration'
  }
  eventsCausingDelays: {}
  eventsCausingGuards: {}
  eventsCausingServices: {
    copyOriginalData: ''
    runCurrentMigration: ''
  }
  matchesStates:
    | 'copying data'
    | 'create shadow db'
    | 'error'
    | 'run current migration'
    | 'shadow db ready'
    | 'structure copied'
  tags: never
}
