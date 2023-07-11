import { Kysely } from 'kysely'
import { type Migration } from '../../../../types'
import logger from 'node-color-log'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function up(db: Kysely<any>): Promise<void> {
  logger.info('add delete at to users up')
  return await db.schema
    .alterTable('users')
    .addColumn('deletedAt', 'datetime')
    .execute()
}

// eslint-disable-next-line
async function transform(db: Kysely<any>): Promise<void> {}

const migration: Migration = {
  up,
  transform,
}

export default migration
