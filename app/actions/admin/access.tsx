import type { AdminRecipeFilters } from '../../data/admin.ts'
import { RECIPE_STATUSES, type RecipeStatus } from '../../domain/types.ts'
import type { AppContext } from '../../router.ts'
import { forbidden, requireViewer } from '../shell.tsx'

export /** Admin-only guard (SKPL TAB-2 "Administrator"). Guests are sent to login. */
function requireAdmin(context: AppContext): Response | null {
  let viewer = requireViewer(context)
  if (viewer instanceof Response) return viewer
  return viewer.isAdmin ? null : forbidden(context)
}

export function parseFilters(params: URLSearchParams): AdminRecipeFilters {
  let status = params.get('status')
  let category = Number(params.get('kategori'))
  let page = Number(params.get('hal'))
  return {
    query: (params.get('q') ?? '').trim().slice(0, 100),
    status: (RECIPE_STATUSES as readonly string[]).includes(status ?? '') ? (status as RecipeStatus) : null,
    categoryId: Number.isInteger(category) && category > 0 ? category : null,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}
