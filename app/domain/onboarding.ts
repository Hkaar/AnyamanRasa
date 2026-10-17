// Onboarding after sign-up (pen.dev 15a–15d) and the "Untukmu" feed it feeds. Only stored rows
// count: favourite categories, the pantry and avoided ingredients. Nothing is inferred from
// similarity.

import type { PantryIngredient } from './pantry.ts'

export const ONBOARDING_STEPS = ['selera', 'dapur', 'pantangan', 'selesai'] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]
/** Steps that ask something ("Langkah X dari 3"); "selesai" is the finish screen. */
export const QUESTION_STEPS = 3

export const MIN_FAVORITE_CATEGORIES = 3
export const MAX_AVOIDED_INGREDIENTS = 20

export function parseStep(raw: unknown): OnboardingStep {
  return ONBOARDING_STEPS.find((step) => step === raw) ?? 'selera'
}

/** 1-based position for "Langkah X dari 3". */
export function stepNumber(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step) + 1
}

export function nextStep(step: OnboardingStep): OnboardingStep {
  return ONBOARDING_STEPS[Math.min(stepNumber(step), ONBOARDING_STEPS.length - 1)]!
}

export function previousStep(step: OnboardingStep): OnboardingStep | null {
  let index = ONBOARDING_STEPS.indexOf(step)
  return index > 0 ? ONBOARDING_STEPS[index - 1]! : null
}

/** Keeps only offered category ids, without duplicates, in the order given. */
export function pickCategoryIds(raw: unknown[], offered: number[]): number[] {
  let ids = raw.map((value) => Number(value)).filter((id) => offered.includes(id))
  return [...new Set(ids)]
}

export function validateFavorites(ids: number[]): string | null {
  return ids.length < MIN_FAVORITE_CATEGORIES ? `Pilih minimal ${MIN_FAVORITE_CATEGORIES} kategori untuk melanjutkan.` : null
}

export interface Preferences {
  favoriteCategoryIds: number[]
  avoidedIngredientIds: string[]
}

export function hasPreferences(preferences: Preferences): boolean {
  return preferences.favoriteCategoryIds.length > 0 || preferences.avoidedIngredientIds.length > 0
}

export interface FeedCandidate<recipe> {
  recipe: recipe
  categoryIds: number[]
  ingredients: PantryIngredient[]
}

export interface Feed<recipe> {
  /** Recipes in at least one favourite category (any recipe when none is chosen), best first. */
  shown: recipe[]
  /** Recipes left out because they use an avoided ingredient, with those ingredients. */
  hidden: { recipe: recipe; avoided: PantryIngredient[] }[]
}

/**
 * Ranks candidates (already in popularity order) by how many favourite categories they belong
 * to. The sort is stable, so ties keep their popularity order.
 */
export function buildFeed<recipe>(candidates: FeedCandidate<recipe>[], preferences: Preferences): Feed<recipe> {
  let favorites = new Set(preferences.favoriteCategoryIds)
  let avoided = new Set(preferences.avoidedIngredientIds)
  let shown: { recipe: recipe; score: number }[] = []
  let hidden: Feed<recipe>['hidden'] = []

  for (let candidate of candidates) {
    let score = candidate.categoryIds.filter((id) => favorites.has(id)).length
    if (favorites.size > 0 && score === 0) continue
    let blocked = candidate.ingredients.filter((ingredient) => avoided.has(ingredient.id))
    if (blocked.length > 0) hidden.push({ recipe: candidate.recipe, avoided: blocked })
    else shown.push({ recipe: candidate.recipe, score })
  }

  shown.sort((a, b) => b.score - a.score)
  return { shown: shown.map((item) => item.recipe), hidden }
}

/** "kacang tanah & udang", "a, b & c". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} & ${names.at(-1)}`
}
