import { DIFFICULTIES, type Difficulty } from '../../domain/types.ts'
import { isUuid } from '../../data/recipes.ts'

export const PANTRY_DURATIONS = [15, 30, 60] as const
export const MAX_PANTRY_INGREDIENTS = 30
export const INITIAL_RESULTS = 5

export interface PantryParams {
  ingredientIds: string[]
  /** Names typed into the no-JS "tambah" field, resolved by the controller. */
  addNames: string[]
  assumeStaples: boolean
  maxMinutes: number | null
  difficulty: Difficulty | null
  showAll: boolean
}

export function parsePantryParams(params: URLSearchParams): PantryParams {
  let ids = [...new Set(params.getAll('bahan').filter(isUuid))].slice(0, MAX_PANTRY_INGREDIENTS)
  let addNames = (params.get('tambah') ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0 && name.length <= 150)
    .slice(0, 10)
  let minutes = Number(params.get('waktu'))
  let difficulty = params.get('kesulitan')
  return {
    ingredientIds: ids,
    addNames,
    // Default on, as in the design. The form posts a hidden pokok=0 plus the
    // checkbox's pokok=1, so an unchecked box arrives as just "0".
    assumeStaples: params.getAll('pokok').includes('1') || !params.has('pokok'),
    maxMinutes: (PANTRY_DURATIONS as readonly number[]).includes(minutes) ? minutes : null,
    difficulty: (DIFFICULTIES as readonly string[]).includes(difficulty ?? '')
      ? (difficulty as Difficulty)
      : null,
    showAll: params.get('tampil') === 'semua',
  }
}

export function pantryHref(base: string, state: PantryParams, overrides: Partial<PantryParams> = {}) {
  let merged = { ...state, ...overrides }
  let params = new URLSearchParams()
  for (let id of merged.ingredientIds) params.append('bahan', id)
  if (!merged.assumeStaples) params.set('pokok', '0')
  if (merged.maxMinutes !== null) params.set('waktu', String(merged.maxMinutes))
  if (merged.difficulty) params.set('kesulitan', merged.difficulty)
  if (merged.showAll) params.set('tampil', 'semua')
  let query = params.toString()
  return query ? `${base}?${query}` : base
}
