import path, { dirname } from 'path'
import { describe, beforeEach, it, expect, afterEach } from 'vitest'
import { interpret } from 'xstate'
import { migrationMachine } from '../machine'
import { logger } from '../../utils/logger'
import { existsSync, mkdirSync, rmdir, rmdirSync, unlinkSync } from 'fs'
import { createSqliteKysely } from '../../utils/sqlite-factory'
import { sql } from 'kysely'

logger.setLevel('debug')

const dbPath = path.resolve(__dirname, './db/database.sql')
const testTableName = 'users'

describe('Migration machine', () => {
  beforeEach(() => {
    if (existsSync(dbPath)) {
      rmdirSync(dirname(dbPath), { recursive: true })
    }
    mkdirSync(dirname(dbPath))
  })
  afterEach(() => {
    if (existsSync(dbPath)) {
      rmdirSync(dirname(dbPath), { recursive: true })
    }
  })
  describe("when database doesn't exist", () => {
    it('should run fresh migration successfully', async () => {
      const getState = async () =>
        new Promise((resolve) => {
          const actor = interpret(
            migrationMachine.withContext({
              dbPath,
              dbExist: false,
              debug: true,
              userVersion: null,
              schemaVersion: null,
              latestVersion: 5,
            }),
          )
          actor.start()
          actor.onTransition(async (state) => {
            if (state.matches('done')) {
              const db = createSqliteKysely(dbPath)
              const userTable =
                await sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${testTableName}`.execute(
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
