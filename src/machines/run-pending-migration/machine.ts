import { createMachine } from "xstate";

export const runPendingMigrationMachine = createMachine({
  id: "run-pending-migrations-machine",
  tsTypes: {} as import("./machine.typegen").Typegen0,
  schema: {},
  predictableActionArguments: true,
  preserveActionOrder: true,
  initial: "create schema db",
  states: {
    "create schema db": {
      always: {
        target: "run next pending migration",
      },
    },
    "run next pending migration": {
      invoke: {
        src: "runNextPendingMigration",
        id: "runNextPendingMigration",
        onDone: [
          {
            target: "copy & transform data",
          },
        ],
        onError: [
          {
            target: "error",
          },
        ],
      },
    },
    "copy & transform data": {
      invoke: {
        src: "copyAndTransform",
        id: "copyAndTransform",
        onDone: [
          {
            target: "schema db migrated",
          },
        ],
        onError: [
          {
            target: "error",
          },
        ],
      },
    },
    "schema db migrated": {
      entry: "updateUserVersion",
      always: {
        target: "delete shadow db",
      },
    },
    "check next migration": {
      entry: "checkPendingMigrations",
      always: [
        {
          target: "create schema db",
          cond: "hasNextPendingMigration",
        },
        {
          target: "done",
        },
      ],
    },
    done: {
      type: "final",
    },
    "delete shadow db": {
      entry: "deleteShadowDb",
      always: {
        target: "rename schema db to shadow db",
      },
    },
    "rename schema db to shadow db": {
      entry: "renameSchemaDbToShadow",
      always: {
        target: "check next migration",
      },
    },
    error: {
      entry: "escalateError",
    },
  },
});
