import type { Viewer } from '../domain/types.ts'

/** Per-request data every page layout needs. Built on the server by `getShell`. */
export interface Shell {
  viewer: Viewer | null
  csrfToken: string
  /** Current path, used for active navigation and post-login redirects. */
  path: string
  flash: Flash | null
}

export interface Flash {
  message: string
  action?: { label: string; href: string }
}

export type NavKey = 'home' | 'recipes' | 'pantry' | 'graph' | null
