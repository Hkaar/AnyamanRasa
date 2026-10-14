import type { Middleware } from 'remix/router'
import { createContextKey } from 'remix/router'

import { type Database, db } from '../db.ts'

export const databaseContext = createContextKey<Database>()

/** Exposes the shared connection pool as `context.db`. */
export function loadDatabase(database: Database = db): Middleware<{
  key: typeof databaseContext
  value: Database
  property: 'db'
}> {
  return (context, next) => {
    context.set(databaseContext, database, { property: 'db' })
    return next()
  }
}
