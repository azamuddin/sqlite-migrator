import { Kysely } from 'kysely'

export type Migration = {
  up: (db: Kysely<any>) => Promise<void>
  transform: (db: Kysely<any>) => Promise<void>
}
