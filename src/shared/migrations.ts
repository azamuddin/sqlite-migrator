import path, { dirname, resolve } from 'path'
import { readdirSync } from 'fs'

import logger from 'node-color-log'
import { Kysely } from 'kysely'

import { createDB } from '../utils/sqlite-factory'
import { asyncForEach } from '../utils/async-foreach'
import { MigrationMachineContext } from '../machines/machine'
import { Migration } from '../types'
import { RunPendingMigrationContext } from '../machines/run-pending-migration/machine'

export const getLatestMigration = (migrationDir: string): number => {
  const migrationVersions = readdirSync(migrationDir)
  const latestVersion = migrationVersions
    .map((version) => parseInt(version))
    .sort((a, b) => b - a)[0]
  return latestVersion
}

export const getMigrations = (migrationDir: string, version: number) => {
  const latestDir = path.resolve(migrationDir, `${version}`)
  return readdirSync(latestDir)
}

export const runFreshMigration =
  (
    migrationRunner: (
      migration: Migration,
      //eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: Kysely<any>,
      fileName: string,
    ) => Promise<void>,
  ) =>
  async (context: MigrationMachineContext) => {
    logger.error('WHA IS GOING ON')
    logger.debug('migrationMachine.services.runFreshMigration', context.dbPath)
    const db = createDB(context.dbPath)
    const latest = getLatestMigration(context.migrationDir)
    await asyncForEach(
      Array.from({ length: latest }).map((_, index) => index + 1),
      async (version) => {
        logger.debug(`PROCESSING migration version ${version}`)
        const files = getMigrations(context.migrationDir, version)
        await asyncForEach(files, async (file) => {
          const migration = await import(
            path.resolve(context.migrationDir, version.toString(), file)
          )
          logger.error(migration, 'MIGRATION TO RUN')
          await migrationRunner(migration.default, db, file)
        })
      },
    )
    logger.debug('DONE PROCESING all migrations')
    return true
  }

export const copyAndTransform = (
  runner: (
    migration: Migration,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    source: Kysely<any>,
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: Kysely<any>,
  ) => Promise<void>,
) => {
  return async (context: RunPendingMigrationContext) => {
    const migrationFiles = getMigrations(
      context.migrationDir,
      context._schemaVersion + 1,
    )
    await asyncForEach(migrationFiles, async (fileName) => {
      const migration = await import(
        resolve(
          context.migrationDir,
          (context._schemaVersion + 1).toString(),
          fileName,
        )
      )
      const source = createDB(resolve(dirname(context.dbPath), 'shadow.sqlite'))
      runner(migration.default, source, context._schemaDB)
    })
  }
}

export const runNextPendingMigration = (
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  runner: (migration: Migration, db: Kysely<any>) => Promise<void>,
) => {
  return async (context: RunPendingMigrationContext) => {
    logger.debug('runNextPendingMigration', context._schemaVersion + 1)
    const migrationFiles = getMigrations(
      context.migrationDir,
      context._schemaVersion + 1,
    )
    await asyncForEach(migrationFiles, async (fileName) => {
      const migration = await import(
        resolve(
          context.migrationDir,
          (context._schemaVersion + 1).toString(),
          fileName,
        )
      )
      runner(migration.default, context._schemaDB)
    })
  }
}
