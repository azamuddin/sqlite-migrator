import { createMachine } from "xstate";
import { createShadowDbMachine } from "../create-shadow-db/machine";
import { runPendingMigrationMachine } from "../run-pending-migration/machine";

export const executeMigrationMachine = createMachine({
  id: "execute-migration-machine",
  tsTypes: {} as import("./machine.typegen").Typegen0,
  schema: {},
  predictableActionArguments: true,
  preserveActionOrder: true,
  initial: "creating shadow db",
  states: {
    "creating shadow db": {
      invoke: {
        src: createShadowDbMachine,
        id: "createShadowDbMachine",
        onDone: [
          {
            target: "running pending migrations",
          },
        ],
        onError: [
          {
            target: "cancelling",
          },
        ],
      },
    },
    "running pending migrations": {
      invoke: {
        src: runPendingMigrationMachine,
        id: "runPendingMigrationMachine",
        onDone: [
          {
            target: "committing",
          },
        ],
        onError: [
          {
            target: "cancelling",
          },
        ],
      },
    },
    committing: {
      initial: "delete shadow db",
      states: {
        "delete shadow db": {
          always: {
            target: "rename original db to original bak",
          },
        },
        "rename original db to original bak": {
          always: {
            target: "rename shadow schema to original db",
          },
        },
        "rename shadow schema to original db": {
          always: {
            target: "original db migrated",
          },
        },
        "original db migrated": {
          always: {
            target: "delete original bak",
          },
        },
        "delete original bak": {
          always: {
            target: "done",
          },
        },
        done: {
          type: "final",
        },
      },
      onDone: {
        target: "migration success",
      },
    },
    cancelling: {
      initial: "delete shadow db",
      states: {
        "delete shadow db": {
          always: {
            target: "delete schema db",
          },
        },
        "delete schema db": {
          always: {
            target: "done",
          },
        },
        done: {
          type: "final",
        },
      },
      onDone: {
        target: "error",
      },
    },
    "migration success": {
      type: "final",
    },
    error: {
      entry: "escalateError",
    },
  },
});
