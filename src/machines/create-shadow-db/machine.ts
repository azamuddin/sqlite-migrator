import { createMachine } from "xstate";

export const createShadowDbMachine = createMachine({
  id: "create-shadow-db-machine",
  tsTypes: {} as import("./machine.typegen").Typegen0,
  schema: {},
  predictableActionArguments: true,
  preserveActionOrder: true,
  initial: "create shadow db",
  states: {
    "create shadow db": {
      always: {
        target: "run current migration",
      },
    },
    "run current migration": {
      description:
        "running migration so that the shadow db has same structure with the current user version",
      invoke: {
        src: "runCurrentMigration",
        id: "runCurrentMigration",
        onDone: [
          {
            target: "structure copied",
          },
        ],
        onError: [
          {
            target: "error",
          },
        ],
      },
    },
    "structure copied": {
      always: {
        target: "copying data",
      },
    },
    "copying data": {
      invoke: {
        src: "copyOriginalData",
        id: "copyOriginalData",
        onDone: [
          {
            target: "shadow db ready",
          },
        ],
        onError: [
          {
            target: "error",
          },
        ],
      },
    },
    "shadow db ready": {
      type: "final",
    },
    error: {
      entry: "escalateError",
    },
  },
});
