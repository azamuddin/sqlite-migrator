![Publish NPM Status](https://github.com/azamuddin/sqlite-migrator/actions/workflows/npm-publish.yml/badge.svg)


# Sqlite Migrator 

## Motivation 

When building offline app with Sqlite, we often have to update database schema on some app's version update. 

But updating database's schema on user side is not as easy on development. 

We have to think about the current structure and data that they have. 

Sometimes we also need to do transformation on the existing data during migration. 

Not only that, but the migration process should take into account the version difference between the user's version and the latest app version they want to update to. 

This risks in data being lost or corrupted if we are not careful. 

`sqlite-migrator` helps to perform such task, in safely manner, because the original database won't be touched until the migration and data transformation is completed. 

## Installation 

```bash
npm install sqlite-migrator --save-dev
```

## Usage

### Migrations Directory and Files

First, you must create a migration file inside a version directory. 

For example: 
```
- migrations/ 
|-- 1/
  |-- 12_07_2023_064602-create_users_table.ts
|-- 2/ 
  |-- 12_08_2023_050423-add-timestamp-to-users-table.ts
  |-- 12_08_2023_070245-add-deleted-at-to-users-table.ts
```


Each file must export migration object that has `up` and `transform` function. You can use type `Migration` to get the typings. 

> Note: this migration file rely on Kysely query builder, you should install it yourself if you need the typings

Here is the example of migration file: 

```
import { Kysely } from 'kysely'
import { type Migration } from 'sqlite-migrator'

// eslint-disable-next-line
async function up(db: Kysely<any>): Promise<void> {
  return await db.schema
    .createTable('users')
    .addColumn('id', 'integer', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar(255)')
    .addColumn('last_name', 'varchar(255)')
    .execute()
}

// eslint-disable-next-line
async function transform(source: Kysely<any>, target: Kysely<any>): Promise<void> {
    // Do some data transformation logic if this migration requires it
    // Fetch data from source database 
    // Perform some transformation 
    // And insert it to target database 
    // Done.
}

const migration: Migration = {
  up,
  transform,
}

export default migration
```



### Run the migrator

```
import { migrate } from 'sqlite-migrator'
import { resolve } from 'path'


migrate({
  dbPath: resolve(__dirname, './database.sqlite'), 
  migrationDir: resolve(__dirname, './migrations')
})
```


## How it works? 

You can see the state machine here: 

1. Migration Machine
https://stately.ai/registry/editor/embed/cc28b545-bcd7-472d-b3a5-ec54f091e228?machineId=cbd7bd16-356f-4f6b-a467-4021d9ef4137

2. Execute Migration Machine 
https://stately.ai/registry/editor/embed/cc28b545-bcd7-472d-b3a5-ec54f091e228?machineId=c08f24bd-f922-443c-8b38-73e91c4514e8

3. Run Pending Migration Machine
https://stately.ai/registry/editor/embed/cc28b545-bcd7-472d-b3a5-ec54f091e228?machineId=933506b9-423d-4017-aabe-c2b7101218f0
