// Variation lineage (SKPL-F-07.x). The ingredient changes shown for a
// variation are computed from stored data, never typed in by hand.

import type { RecipeIngredientLine } from './types.ts'

export type IngredientChange =
  | { kind: 'added'; line: RecipeIngredientLine }
  | { kind: 'removed'; line: RecipeIngredientLine }
  | { kind: 'changed'; line: RecipeIngredientLine; previous: RecipeIngredientLine }
  | { kind: 'same'; line: RecipeIngredientLine }

export function diffIngredients(
  parent: readonly RecipeIngredientLine[],
  variation: readonly RecipeIngredientLine[],
): IngredientChange[] {
  let parentById = new Map(parent.map((line) => [line.ingredientId, line]))
  let variationIds = new Set(variation.map((line) => line.ingredientId))

  let changes: IngredientChange[] = variation.map((line) => {
    let previous = parentById.get(line.ingredientId)
    if (!previous) return { kind: 'added', line }
    if (previous.quantity !== line.quantity || (previous.unit ?? '') !== (line.unit ?? '')) {
      return { kind: 'changed', line, previous }
    }
    return { kind: 'same', line }
  })

  for (let line of parent) {
    if (!variationIds.has(line.ingredientId)) changes.push({ kind: 'removed', line })
  }
  return changes
}

/** Only the lines that differ from the source recipe. */
export function ingredientChangesOnly(changes: IngredientChange[]): IngredientChange[] {
  return changes.filter((change) => change.kind !== 'same')
}
