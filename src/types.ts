import { Kysely } from 'kysely'

export type Migration = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  up: (db: Kysely<any>) => Promise<void>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transform: (source: Kysely<any>, db: Kysely<any>) => Promise<void>
}
