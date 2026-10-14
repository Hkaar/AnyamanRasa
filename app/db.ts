import { type Database, type SqlStatement, sql } from 'remix/data-table'
import { createPostgresDatabase } from 'remix/data-table/postgres'

export type { Database, SqlStatement }

let connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env for local development.')
}

export const db: Database = createPostgresDatabase({ connectionString })

/** Runs a statement and returns its rows typed as `T`. */
export async function queryRows<T>(database: Database, statement: SqlStatement): Promise<T[]> {
  let result = await database.exec(statement)
  return (result.rows ?? []) as T[]
}

export async function queryRow<T>(database: Database, statement: SqlStatement): Promise<T | null> {
  let rows = await queryRows<T>(database, statement)
  return rows[0] ?? null
}

/** Joins SQL fragments with a separator, e.g. `and` conditions or a value list. */
export function joinSql(parts: SqlStatement[], separator: string): SqlStatement {
  if (parts.length === 0) return sql``
  return parts.reduce((joined, part) => sql`${joined}${rawFragment(separator)}${part}`)
}

function rawFragment(text: string): SqlStatement {
  return { text, values: [] }
}
