import Database from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import logger from 'node-color-log'

export const createDB = <DatabaseSchema = any>(path: string) => {
  const sqlite = new Database(path)
  sqlite.pragma('journal_mode = WAL')
  const dialect = new SqliteDialect({
    database: sqlite,
  })
  const db = new Kysely<DatabaseSchema>({
    dialect,
    log: (event) => {
      if (event.level === 'query') {
        logger.color('red').bgColor('blue').debug(event.query.sql)
      }
    },
  })
  return db
}
