import path, { dirname } from 'path'
import { describe, beforeEach, it, expect, afterEach } from 'vitest'
import { interpret } from 'xstate'
import { migrationMachine } from '../machine'
import { logger } from '../../utils/logger'
import { existsSync, mkdirSync, rmdir, rmdirSync, unlinkSync } from 'fs'
import { createSqliteKysely } from '../../utils/sqlite-factory'
import { sql } from 'kysely'

logger.setLevel('debug')

const DB_PATH = path.resolve(__dirname, './db/database.sql')
const TEST_TABLE_NAME = 'users'
const MIGRATION_DIR = path.resolve(__dirname, './migrations')

describe('Migration machine', () => {
  beforeEach(() => {
    if (existsSync(DB_PATH)) {
      rmdirSync(dirname(DB_PATH), { recursive: true })
    }
    mkdirSync(dirname(DB_PATH))
  })
  afterEach(() => {
    if (existsSync(DB_PATH)) {
      rmdirSync(dirname(DB_PATH), { recursive: true })
    }
  })
  describe("when database doesn't exist", () => {
    it('should run fresh migration successfully', async () => {
      const getState = async () =>
        new Promise((resolve) => {
          const actor = interpret(
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
          actor.start()
          actor.onTransition(async (state) => {
            logger.debug('STATE: ' + state.toStrings())
            if (state.matches('done')) {
              const db = createSqliteKysely(DB_PATH)
              const userTable =
                await sql`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`.execute(
                  db,
                )
              if (userTable.rows.length > 0) {
                resolve('success')
              }
            }
          })
        })

      const state = await getState()
      expect(state).toEqual('success')
    })
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
