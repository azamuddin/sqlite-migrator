import { Kysely } from 'kysely'
import logger from 'node-color-log'
import { type Migration } from '../../../../types'

export async function up(db: Kysely<any>): Promise<void> {
  logger.setLevel('debug')
  logger.info('create users table up', db)
  return await db.schema
    .createTable('users')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar(255)')
    .addColumn('last_name', 'varchar(255)')
    .execute()
}

export async function transform(db: Kysely<any>): Promise<void> {
  // nothing
}

const migration: Migration = {
  up,
  transform,
}

export default migration
