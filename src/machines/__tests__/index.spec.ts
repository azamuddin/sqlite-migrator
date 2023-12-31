import path, { dirname } from 'path'
import { existsSync, mkdirSync, rmdirSync } from 'fs'

import { describe, beforeEach, it, expect, afterEach } from 'vitest'
import { interpret } from 'xstate'
import Sqlite from 'better-sqlite3'
import { Kysely, sql } from 'kysely'

import { MigrationMachineContext, migrationMachine } from '../machine'
import { logger } from '../../utils/logger'
import { createDB as createDB } from '../../utils/sqlite-factory'
import {
  copyAndTransform,
  getLatestMigration,
  runFreshMigration,
  runNextPendingMigration,
} from '../../shared/migrations'
import { Migration } from '../../types'
import { executeMigrationMachine } from '../execute-migration/machine'
import { runPendingMigrationMachine } from '../run-pending-migration/machine'

import createUsersTable from './migrations/1/2023_07_08_133201-create-users-table'

logger.setLevel('info')

const DB_PATH = path.resolve(__dirname, './db/database.sqlite')
const MIGRATION_DIR = path.resolve(__dirname, './migrations')
const createMigrationActor = (
  config?: Parameters<(typeof migrationMachine)['withConfig']>[0],
  context?: Partial<MigrationMachineContext>,
) => {
  let machine = migrationMachine
  if (config) {
    machine = machine.withConfig(config)
  }
  return interpret(
    machine.withContext(
      context
        ? { ...machine.context, ...context }
        : {
            ...machine.context,
            dbPath: DB_PATH,
            debug: true,
            migrationDir: MIGRATION_DIR,
          },
    ),
  )
}

const runMigrationAsync = async () => {
  logger.debug('runMigrationAsync START')
  return new Promise((resolve) => {
    const actor = createMigrationActor().start()
    actor.onTransition((state) => {
      logger.debug(state.toStrings())
      if (state.matches('done')) {
        resolve(true)
      }
    })
  })
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
    it('should run migrations in the correct order', async () => {
      const getResult = async (): Promise<string[]> => {
        return new Promise((resolve) => {
          const migrationsRun: string[] = []
          const mockedRunner = async (
            migration: Migration,
            //eslint-disable-next-line @typescript-eslint/no-explicit-any
            db: Kysely<any>,
            filePath: string,
          ) => {
            migrationsRun.push(filePath)
            migration.up(db)
          }
          const actor = createMigrationActor({
            services: { runFreshMigration: runFreshMigration(mockedRunner) },
          }).start()
          actor.onTransition((state) => {
            if (state.matches('done')) {
              resolve(migrationsRun)
            }
          })
        })
      }
      const result = await getResult()
      expect(result[0]).toEqual('2023_07_08_133201-create-users-table.ts')
      expect(result[1]).toEqual(
        '2023_07_09_144933-add-timestamp-to-users-table.ts',
      )
      expect(result[2]).toEqual(
        '2023_07_09_150000-add-deleted-at-to-users-table.ts',
      )
    })

    it('should update user version pragma', async () => {
      const getResult = async () => {
        return new Promise((resolve) => {
          const actor = createMigrationActor().start()
          actor.onTransition(async (state) => {
            if (state.matches('done')) {
              const db = createDB(DB_PATH)
              const result = await sql<{
                user_version: number
              }>`PRAGMA user_version`.execute(db)
              resolve(result.rows[0].user_version)
            }
          })
        })
      }
      const version = await getResult()
      expect(version).toEqual(2)
    })
  })

  describe('When database already exists', () => {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Context = { db: Kysely<any> }
    beforeEach<Context>((context) => {
      if (!existsSync(dirname(DB_PATH))) {
        mkdirSync(dirname(DB_PATH))
      }
      context.db = createDB(DB_PATH)
    })
    afterEach(() => {
      if (existsSync(dirname(DB_PATH))) {
        rmdirSync(dirname(DB_PATH), { recursive: true })
      }
    })
    describe('When user version already latest', () => {
      beforeEach(async () => {
        // setup database such that it is already latest
        if (existsSync(DB_PATH)) {
          rmdirSync(dirname(DB_PATH), { recursive: true })
        }
        if (!existsSync(dirname(DB_PATH))) {
          mkdirSync(dirname(DB_PATH))
        }
        await runMigrationAsync()
      })
      it('should not do migration', async () => {
        const getResult = async () => {
          return new Promise((resolve) => {
            const actor = createMigrationActor().start()
            actor.onTransition((state) => {
              logger.debug(state.toStrings(), 'STATE VALUE')
              if (state.matches('run pending migration')) {
                resolve(true)
              }
              if (state.matches('run fresh migration')) {
                resolve(true)
              }
              if (state.matches('done')) {
                resolve(false)
              }
            })
          })
        }
        const result = await getResult()
        expect(result, 'migration run').toBeFalsy()
      })
    })

    describe('When user version is not latest', () => {
      beforeEach(async () => {
        // setup such that user version is ONE (1)
        const db = createDB(DB_PATH)
        await createUsersTable.up(db)
        const sqlite = new Sqlite(DB_PATH)
        sqlite.exec(`PRAGMA user_version = 1`)
      })
      it<Context>('should run pending migration successfully', async () => {
        const getResult = async (): Promise<{
          userVersion: number
          createdAt: boolean
          updatedAt: boolean
          deletedAt: boolean
        }> => {
          logger.debug('get result')
          return new Promise((resolve, reject) => {
            const actor = createMigrationActor().start()
            actor.onTransition(async (state) => {
              logger.debug(state.toStrings(), 'STATE')
              if (state.matches('run pending migration')) {
                const executeMigrationMachine =
                  state.children['executeMigrationMachine']
                executeMigrationMachine.subscribe((state) => {
                  logger.debug(state.value, 'STATE executeMigrationMachine')
                  if (state.matches('running pending migrations')) {
                    const pendingMigrationMachine =
                      state.children['runPendingMigrationMachine']
                    pendingMigrationMachine.onTransition((state) => {
                      logger.debug(
                        state.value,
                        'STATE runPendingMigrationMachine',
                      )
                    })
                  }
                })
              }
              if (state.matches('migration failed')) {
                reject()
              }
              if (state.matches('done')) {
                const db = createDB(DB_PATH)
                // user version
                const versions = await sql<{
                  user_version: number
                }>`PRAGMA user_version`.execute(db)
                const userVersion = versions.rows[0].user_version
                // columns
                const { rows: columns } = await sql<{
                  name: string
                }>`PRAGMA table_info(users)`.execute(db)
                const createdAt = columns.find((col) => col.name == 'createdAt')
                const updatedAt = columns.find((col) => col.name == 'updatedAt')
                const deletedAt = columns.find(
                  (col) => col.name === 'deletedAt',
                )
                resolve({
                  userVersion,
                  createdAt: Boolean(createdAt),
                  updatedAt: Boolean(updatedAt),
                  deletedAt: Boolean(deletedAt),
                })
              }
            })
          })
        }
        const result = await getResult()
        const actualLatestVersion = getLatestMigration(MIGRATION_DIR)
        expect(result.createdAt, 'createdAt must exist').toBeTruthy()
        expect(result.updatedAt, 'updatedAt must exist').toBeTruthy()
        expect(result.deletedAt, 'deletedAt must exist').toBeTruthy()
        expect(result.userVersion, 'user version').toEqual(actualLatestVersion)
      })
      it('should run transform after up on each schema version', async () => {
        const getResult = async () => {
          const calls: string[] = []
          const mockedRunPendingMigration = async (
            migration: Migration,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            db: Kysely<any>,
          ) => {
            calls.push('up')
            await migration.up(db)
          }
          const mockedRunner = async (
            migration: Migration,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source: Kysely<any>,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            target: Kysely<any>,
          ) => {
            calls.push('transform')
            await migration.transform(source, target)
          }
          return new Promise((resolve) => {
            const actor = createMigrationActor({
              services: {
                executeMigrationMachine: executeMigrationMachine.withConfig({
                  services: {
                    runPendingMigrationMachine:
                      runPendingMigrationMachine.withConfig({
                        services: {
                          runNextPendingMigration: runNextPendingMigration(
                            mockedRunPendingMigration,
                          ),
                          copyAndTransform: copyAndTransform(mockedRunner),
                        },
                      }),
                  },
                }),
              },
            }).start()
            actor.onTransition((state) => {
              if (state.matches('done')) {
                // to check something
                resolve(calls)
              }
            })
          })
        }
        const result = await getResult()
        expect(result).toEqual(['up', 'up', 'transform', 'transform'])
      })
    })
  })
})
