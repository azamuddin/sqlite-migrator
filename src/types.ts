import { Kysely } from 'kysely'

export type Migration = {
  up: (db: Kysely<any>) => Promise<void>
  transform: (source: Kysely<any>, db: Kysely<any>) => Promise<void>
}
