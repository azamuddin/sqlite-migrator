import { Kysely, sql } from 'kysely'
import { type Migration } from '../../../../types'
import logger from 'node-color-log'

export async function up(db: Kysely<any>): Promise<void> {
  logger.info('add delete at to users up')
  return await db.schema
    .alterTable('users')
    .addColumn('deletedAt', 'datetime')
    .execute()
}

export async function transform(db: Kysely<any>): Promise<void> {}

const migration: Migration = {
  up,
  transform,
}

export default migration
