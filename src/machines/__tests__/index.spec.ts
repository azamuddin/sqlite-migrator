import path, { dirname } from 'path'
import { describe, beforeEach, it, expect, afterEach } from 'vitest'
import { interpret } from 'xstate'
import { migrationMachine } from '../machine'
import { logger } from '../../utils/logger'
import { existsSync, mkdirSync, rmdir, rmdirSync, unlinkSync } from 'fs'
import { createDB as createDB } from '../../utils/sqlite-factory'
import { sql } from 'kysely'

logger.setLevel('debug')

const DB_PATH = path.resolve(__dirname, './db/database.sql')
const MIGRATION_DIR = path.resolve(__dirname, './migrations')
const createMigrationActor = () => {
  return interpret(
    migrationMachine.withContext({
      dbPath: DB_PATH,
      debug: true,
      migrationDir: MIGRATION_DIR,
      _dbExist: false,
      _userVersion: null,
      _schemaVersion: null,
      _latestVersion: null,
    }),
  )
}

describe('Migration machine', () => {
  describe("when database doesn't exist", () => {
    beforeEach(() => {
      if (existsSync(DB_PATH)) {
        rmdirSync(dirname(DB_PATH), { recursive: true })
      }
      if (!existsSync(dirname(DB_PATH))) {
        mkdirSync(dirname(DB_PATH))
      }
    })
    afterEach(() => {
      if (existsSync(DB_PATH)) {
        rmdirSync(dirname(DB_PATH), { recursive: true })
      }
    })
    it('should run fresh migration successfully', async () => {
      const getState = async () =>
        new Promise((resolve) => {
          const actor = createMigrationActor().start()
          actor.onTransition(async (state) => {
            logger.debug('STATE: ' + state.toStrings())
            if (state.matches('done')) {
              const db = createDB(DB_PATH)
              const userTable =
                await sql`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`.execute(
                  db,
                )
              resolve(userTable.rows.length === 1)
            }
          })
        })
      const exist = await getState()
      expect(exist, 'users table should be created').toBeTruthy()
    })
    it('should have correct result based on migrations files', async () => {
      const getState = async () => {
        return new Promise((resolve) => {
          const actor = createMigrationActor().start()
          actor.onTransition(async (state) => {
            const db = createDB(DB_PATH)
            if (state.matches('done')) {
              const { rows: columns } = await sql<{
                name: string
              }>`PRAGMA table_info(users)`.execute(db)
              // logger.debug(JSON.stringify(columns, null, 2), 'columns')
              const createdAt = columns.find((col) => col.name == 'createdAt')
              const updatedAt = columns.find((col) => col.name == 'updatedAt')
              const deletedAt = columns.find((col) => col.name === 'deletedAt')
              resolve(
                Boolean(deletedAt) && Boolean(updatedAt) && Boolean(createdAt),
              )
            }
          })
        })
      }
      const deletedAtExists = await getState()
      expect(
        deletedAtExists,
        'createdAt, updatedAt and deletedAt column should exists',
      ).toBeTruthy()
    })
    it.skip('should run migrations in the correct order', () => {})
  })
  describe('When database already exists', () => {
    describe('When user schema already latest', () => {
      it.todo('should not do migration')
    })
    describe('Else', () => {
      it.todo('should run pending migration successfully')
    })
  })
})
