import path from 'path'
import { readdirSync } from 'fs'

import logger from 'node-color-log'
import { Kysely } from 'kysely'

import { createDB } from '../utils/sqlite-factory'
import { asyncForEach } from '../utils/async-foreach'
import { MigrationMachineContext } from '../machines/machine'
import { Migration } from '../types'


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
