import {interpret} from 'xstate';
import {migrationMachine} from './machines/machine';

interface MigrationOptions {
  dbPath: string;
  latestVersion: number;
}

const migrate = (options: MigrationOptions) => {
  console.log('DUMMY MIGRATION READY');
  const migrationActor = interpret(
    migrationMachine.withContext({
      dbPath: options.dbPath,
      latestVersion: options.latestVersion,
      schemaVersion: null,
      userVersion: null,
      dbExist: false,
    }),
  );
  migrationActor.start();
};

export {migrate};
