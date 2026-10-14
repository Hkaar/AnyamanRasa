// Rebuilds the dedicated test database from migrations + seed before the run.
// The test script points DATABASE_URL at `anyaman_rasa_test`; it never touches
// the development database.
import { readFile } from 'node:fs/promises'

import { loadMigrations } from 'remix/data-table/migrations/node'
import { createPostgresDatabase } from 'remix/data-table/postgres'
import { sql } from 'remix/data-table'

export async function globalSetup() {
  let url = new URL(process.env.DATABASE_URL ?? '')
  let name = url.pathname.slice(1)
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to reset "${name}": tests require a database whose name ends in _test.`)
  }

  let adminUrl = new URL(url)
  adminUrl.pathname = '/postgres'
  let admin = createPostgresDatabase({ connectionString: adminUrl.toString() })
  let exists = await admin.exec(sql`select 1 from pg_database where datname = ${name}`)
  if ((exists.rows ?? []).length === 0) await admin.executeScript(`create database "${name}"`)
  await admin.close()

  let db = createPostgresDatabase({ connectionString: url.toString() })
  await db.executeScript('drop schema public cascade; create schema public;')
  await db.migrate(await loadMigrations(new URL('../db/migrations/', import.meta.url).pathname))
  await db.executeScript(await readFile(new URL('../db/seed.sql', import.meta.url), 'utf8'))
  await db.close()
}
