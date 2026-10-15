import { attachDatabasePool } from '@vercel/functions'
import pg from 'pg'
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

const pool = new pg.Pool({
  connectionString,
  max: Number(process.env.DATABASE_POOL_MAX) || (serverless ? 3 : 10),
  idleTimeoutMillis: serverless ? 5_000 : 10_000,
  // Fail fast (error page) instead of hanging until the platform kills the request.
  connectionTimeoutMillis: 10_000,
})

// A frozen Vercel instance cannot run the idle timer, so it would keep its connections open
// while suspended. This keeps the instance alive just long enough to close them (no-op elsewhere).
attachDatabasePool(pool)

export const db: Database = createPostgresDatabase(pool)

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
