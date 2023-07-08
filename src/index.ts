import {interpret} from 'xstate';
import {migrationMachine} from './machines/machine';
import {logger} from './utils/logger';

interface MigrationOptions {
  dbPath: string;
  latestVersion: number;
  debug: boolean;
}

const migrate = (options: MigrationOptions) => {
  const {dbPath, latestVersion, debug = false} = options;

  if (debug) {
    logger.setLevel('debug');
  }

  const migrationActor = interpret(
    migrationMachine.withContext({
      dbPath: dbPath,
      latestVersion: latestVersion,
      schemaVersion: null,
      userVersion: null,
      dbExist: false,
      debug: debug,
    }),
  );
  migrationActor.start();
};

export {migrate};
