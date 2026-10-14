import { type Database, type SqlStatement, sql } from 'remix/data-table'
import { createPostgresDatabase } from 'remix/data-table/postgres'

export type { Database, SqlStatement }

let connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env for local development.')
}

// Serverless platforms run many short-lived instances, each with its own pool, and a hosted
// pooler such as Supabase's caps client connections (200 on the free tier). Keep each
// instance's pool small and release idle connections quickly there. DATABASE_POOL_MAX overrides.
const serverless = Boolean(process.env.VERCEL)
const poolMax = Number(process.env.DATABASE_POOL_MAX) || (serverless ? 3 : 10)

export const db: Database = createPostgresDatabase({
  connectionString,
  max: poolMax,
  idleTimeoutMillis: serverless ? 5_000 : 10_000,
})

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
