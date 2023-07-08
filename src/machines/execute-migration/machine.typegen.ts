// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.createShadowDbMachine": {
      type: "done.invoke.createShadowDbMachine";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: "escalateError";
    delays: never;
    guards: never;
    services: "createShadowDbMachine" | "runPendingMigrationMachine";
  };
  eventsCausingActions: {
    escalateError: "done.state.execute-migration-machine.cancelling";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    createShadowDbMachine: "xstate.init";
    runPendingMigrationMachine: "done.invoke.createShadowDbMachine";
  };
  matchesStates:
    | "cancelling"
    | "cancelling.delete schema db"
    | "cancelling.delete shadow db"
    | "cancelling.done"
    | "committing"
    | "committing.delete original bak"
    | "committing.delete shadow db"
    | "committing.done"
    | "committing.original db migrated"
    | "committing.rename original db to original bak"
    | "committing.rename shadow schema to original db"
    | "creating shadow db"
    | "error"
    | "migration success"
    | "running pending migrations"
    | {
        cancelling?: "delete schema db" | "delete shadow db" | "done";
        committing?:
          | "delete original bak"
          | "delete shadow db"
          | "done"
          | "original db migrated"
          | "rename original db to original bak"
          | "rename shadow schema to original db";
      };
  tags: never;
}
