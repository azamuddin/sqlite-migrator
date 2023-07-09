import { Kysely } from 'kysely'
import logger from 'node-color-log'

export const version = 1

export async function up(db: Kysely<any>): Promise<void> {
  logger.setLevel('debug')
  logger.info('migration up', db)
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
