// Pantry Search matching (SKPL-F-05.2, F-05.3). Pure and deterministic: a recipe
// matches only through its explicit recipe_ingredients rows, and substitutions
// come only from explicit substitute_for relations.

export interface PantryIngredient {
  id: string
  name: string
}

export interface PantryCandidate<recipe> {
  recipe: recipe
  ingredients: PantryIngredient[]
}

export interface Substitution {
  /** The ingredient the recipe needs. */
  sourceId: string
  /** An explicitly recorded substitute for it. */
  target: PantryIngredient
  label: string | null
}

export interface SubstitutionSuggestion {
  missing: PantryIngredient
  substitute: PantryIngredient
  label: string | null
  /** The substitute is already in the user's pantry. */
  inPantry: boolean
}

export interface PantryMatch<recipe> {
  recipe: recipe
  have: PantryIngredient[]
  missing: PantryIngredient[]
  /** Ingredients assumed available because they are basic staples. */
  assumed: PantryIngredient[]
  substitutions: SubstitutionSuggestion[]
  matchedCount: number
  requiredCount: number
  /** Whole percentage, 0–100. */
  percent: number
}

export interface PantryMatchOptions {
  /** Treat basic staples as available and leave them out of the counts. */
  assumeStaples: boolean
}

/** Basic staples named in the Pantry Search toggle copy. */
export const STAPLE_INGREDIENT_NAMES = ['garam', 'minyak goreng', 'bawang merah'] as const

export function normalizeIngredientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isStaple(ingredient: PantryIngredient): boolean {
  return (STAPLE_INGREDIENT_NAMES as readonly string[]).includes(
    normalizeIngredientName(ingredient.name),
  )
}

export function matchRecipe<recipe>(
  candidate: PantryCandidate<recipe>,
  pantryIds: ReadonlySet<string>,
  substitutions: readonly Substitution[],
  options: PantryMatchOptions,
): PantryMatch<recipe> {
  let have: PantryIngredient[] = []
  let missing: PantryIngredient[] = []
  let assumed: PantryIngredient[] = []

  for (let ingredient of uniqueById(candidate.ingredients)) {
    if (pantryIds.has(ingredient.id)) have.push(ingredient)
    else if (options.assumeStaples && isStaple(ingredient)) assumed.push(ingredient)
    else missing.push(ingredient)
  }

  let missingIds = new Set(missing.map((ingredient) => ingredient.id))
  let suggestions = substitutions
    .filter((substitution) => missingIds.has(substitution.sourceId))
    .map((substitution) => ({
      missing: missing.find((ingredient) => ingredient.id === substitution.sourceId)!,
      substitute: substitution.target,
      label: substitution.label,
      inPantry: pantryIds.has(substitution.target.id),
    }))
    .sort((a, b) => Number(b.inPantry) - Number(a.inPantry))

  let requiredCount = have.length + missing.length
  return {
    recipe: candidate.recipe,
    have,
    missing,
    assumed,
    substitutions: suggestions,
    matchedCount: have.length,
    requiredCount,
    percent: requiredCount === 0 ? 0 : Math.round((have.length / requiredCount) * 100),
  }
}

/**
 * Matches every candidate against the pantry and ranks the results that use at
 * least one pantry ingredient: highest match ratio first, then most matched
 * ingredients, then fewest missing, then title.
 */
export function rankPantryMatches<recipe extends { title: string }>(
  candidates: readonly PantryCandidate<recipe>[],
  pantryIds: ReadonlySet<string>,
  substitutions: readonly Substitution[],
  options: PantryMatchOptions,
): PantryMatch<recipe>[] {
  if (pantryIds.size === 0) return []

  return candidates
    .map((candidate) => matchRecipe(candidate, pantryIds, substitutions, options))
    .filter((match) => match.matchedCount > 0)
    .sort(
      (a, b) =>
        ratio(b) - ratio(a) ||
        b.matchedCount - a.matchedCount ||
        a.missing.length - b.missing.length ||
        a.recipe.title.localeCompare(b.recipe.title, 'id'),
    )
}

function ratio(match: PantryMatch<unknown>): number {
  return match.requiredCount === 0 ? 0 : match.matchedCount / match.requiredCount
}

function uniqueById(ingredients: PantryIngredient[]): PantryIngredient[] {
  let seen = new Set<string>()
  return ingredients.filter((ingredient) => !seen.has(ingredient.id) && seen.add(ingredient.id))
}
