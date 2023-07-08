import Database from 'better-sqlite3';
import {Kysely, SqliteDialect} from 'kysely';

export const createSqliteKysely = <DatabaseSchema = any>(path: string) => {
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  const dialect = new SqliteDialect({
    database: sqlite,
  });
  const db = new Kysely<DatabaseSchema>({
    dialect,
  });
  return db;
};
