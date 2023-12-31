import Sqlite from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import logger from 'node-color-log'

// eslint-disable-next-line
export const createDB = <DatabaseSchema = any>(path: string) => {
  const sqlite = new Sqlite(path)
  sqlite.pragma('journal_mode = WAL')
  const dialect = new SqliteDialect({
    database: sqlite,
  })
  const db = new Kysely<DatabaseSchema>({
    dialect,
    log: (event) => {
      if (event.level === 'query') {
        if (logger.level === 'debug') {
          logger
            .color('cyan')
            .log('QUERY')
            .joint()
            .color('red')
            .bgColor('blue')
            .log(event.query.sql)
        }
      }
    },
  })
  return db
}
