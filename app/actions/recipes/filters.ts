import { RECIPE_SORTS, type RecipeFilters, type RecipeSort } from '../../data/recipes.ts'
import { DIFFICULTIES, type Difficulty } from '../../domain/types.ts'

export const PAGE_SIZE = 10
const MAX_PAGE = 50
export const DURATION_OPTIONS = [15, 30, 60, 120] as const

/** Parses browse query params (`q`, `kategori`, `kesulitan`, `durasi`, `urut`, `hal`). Invalid values are ignored. */
export function parseRecipeFilters(params: URLSearchParams): RecipeFilters {
  let query = (params.get('q') ?? '').trim().slice(0, 100)
  let categoryIds = params
    .getAll('kategori')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
  let difficulties = params
    .getAll('kesulitan')
    .filter((value): value is Difficulty => (DIFFICULTIES as readonly string[]).includes(value))
  let duration = Number(params.get('durasi'))
  let maxMinutes = (DURATION_OPTIONS as readonly number[]).includes(duration) ? duration : null
  let sortParam = params.get('urut')
  let sort: RecipeSort = RECIPE_SORTS.find((value) => value === sortParam) ?? (query ? 'relevan' : 'populer')
  let page = Number(params.get('hal'))
  return {
    query,
    categoryIds: [...new Set(categoryIds)],
    difficulties: [...new Set(difficulties)],
    maxMinutes,
    sort,
    page: Number.isInteger(page) && page > 0 ? Math.min(page, MAX_PAGE) : 1,
    pageSize: PAGE_SIZE,
  }
}

export function filtersToParams(filters: RecipeFilters, overrides: Partial<RecipeFilters> = {}) {
  let merged = { ...filters, ...overrides }
  let params = new URLSearchParams()
  if (merged.query) params.set('q', merged.query)
  for (let id of merged.categoryIds) params.append('kategori', String(id))
  for (let difficulty of merged.difficulties) params.append('kesulitan', difficulty)
  if (merged.maxMinutes !== null) params.set('durasi', String(merged.maxMinutes))
  let defaultSort = merged.query ? 'relevan' : 'populer'
  if (merged.sort !== defaultSort) params.set('urut', merged.sort)
  if (merged.page > 1) params.set('hal', String(merged.page))
  return params
}

export function hasActiveFilters(filters: RecipeFilters): boolean {
  return (
    filters.query !== '' ||
    filters.categoryIds.length > 0 ||
    filters.difficulties.length > 0 ||
    filters.maxMinutes !== null
  )
}
