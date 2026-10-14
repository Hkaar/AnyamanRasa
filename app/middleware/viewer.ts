import type { Middleware } from 'remix/router'
import { createContextKey } from 'remix/router'
import { Session } from 'remix/session'

import { findViewer } from '../data/users.ts'
import type { Viewer } from '../domain/types.ts'
import { databaseContext } from './database.ts'

export const viewerContext = createContextKey<Viewer | null>()

export const SESSION_USER_KEY = 'userId'

/** Resolves the signed-in user from the session as `context.viewer` (null for guests). */
export function loadViewer(): Middleware<{
  key: typeof viewerContext
  value: Viewer | null
  property: 'viewer'
}> {
  return async (context, next) => {
    let session = context.get(Session)
    let db = context.get(databaseContext)
    if (!session || !db) throw new Error('loadViewer() requires session and database middleware')
    let userId = session.get(SESSION_USER_KEY)
    let viewer = typeof userId === 'string' ? await findViewer(db, userId) : null

    // The account was removed: drop the stale identity rather than keep failing lookups.
    if (typeof userId === 'string' && viewer === null) session.unset(SESSION_USER_KEY)

    context.set(viewerContext, viewer, { property: 'viewer' })
    return next()
  }
}
