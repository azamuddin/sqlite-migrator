import { interpret } from 'xstate'
import { MigrationMachineContext, migrationMachine } from './machines/machine'
import { logger } from './utils/logger'

type MigrationOptions = Pick<
  MigrationMachineContext,
  'migrationDir' | 'debug' | 'dbPath'
>

const migrate = (options: MigrationOptions) => {
  const { dbPath, migrationDir, debug = false } = options

  if (debug) {
    logger.setLevel('debug')
  }

  const migrationActor = interpret(
    migrationMachine.withContext({
      dbPath: dbPath,
      debug: debug,
      migrationDir: migrationDir,
      _latestVersion: 1,
      _userVersion: 0,
      _dbExist: false,
    }),
  )
  migrationActor.start()
}

export { migrate }
