import { Kysely, sql } from 'kysely'
import { type Migration } from '../../../../types'
import logger from 'node-color-log'

export const version = 1

export async function up(db: Kysely<any>): Promise<void> {
  logger.info('add timestamp up')
  // return await db.schema
  //   .alterTable('users')
  //   .addColumn('createdAt', 'datetime')
  //   .addColumn('updatedAt', 'datetime', (col) => col.defaultTo(sql`NOW()`))
  //   .execute()
}

export async function transform(db: Kysely<any>): Promise<void> {}

const migration: Migration = {
  up,
  transform,
}

export default migration
