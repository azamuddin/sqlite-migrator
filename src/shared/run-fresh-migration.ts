import logger from 'node-color-log'
import { createDB } from '../utils/sqlite-factory'
import { asyncForEach } from '../utils/async-foreach'
import { MigrationMachineContext } from '../machines/machine'
import path from 'path'
import { readdirSync } from 'fs'
import { Migration } from '../types'
import { Kysely } from 'kysely'

const getLatestMigration = (migrationDir: string): number => {
  const migrationVersions = readdirSync(migrationDir)
  const latestVersion = migrationVersions
    .map((version) => parseInt(version))
    .sort((a, b) => b - a)[0]
  return latestVersion
}

const getMigrations = (migrationDir: string, version: number) => {
  const latestDir = path.resolve(migrationDir, `${version}`)
  return readdirSync(latestDir)
}

export const runFreshMigration =
  (migrationRunner: (migration: Migration, db: Kysely<any>) => Promise<void>) =>
  async (context: MigrationMachineContext) => {
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
          await migrationRunner(migration, db)
        })
      },
    )
    logger.debug('DONE PROCESING all migrations')
    return true
  }
