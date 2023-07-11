import { Kysely, sql } from 'kysely'
import logger from 'node-color-log'

import { type Migration } from '../../../../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function up(db: Kysely<any>): Promise<void> {
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

// eslint-disable-next-line
async function transform(
  source: Kysely<any>,
  target: Kysely<any>,
): Promise<void> {}

const migration: Migration = {
  up,
  transform,
}

export default migration
