import { Kysely, sql } from 'kysely'
import { type Migration } from '../../../../types'
import logger from 'node-color-log'

export async function up(db: Kysely<any>): Promise<void> {
  logger.info('add timestamp up')
  await db.schema
    .alterTable('users')
    .addColumn('createdAt', 'datetime')
    .execute()

  await db.schema
    .alterTable('users')
    .addColumn('updatedAt', 'datetime', (col) => col.defaultTo(sql`NOW`))
    .execute()
}

export async function transform(db: Kysely<any>): Promise<void> {}

const migration: Migration = {
  up,
  transform,
}

export default migration
