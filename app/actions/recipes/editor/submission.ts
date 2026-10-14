// Shared server-side handling for the create, edit and variation editors.

import { ensureIngredients } from '../../../data/ingredients.ts'
import { isProvidedFile, storeImage, uploadErrorMessage } from '../../../data/media.ts'
import { listCategories, type RecipeWrite } from '../../../data/recipes.ts'
import {
  type ParsedRecipe,
  type RecipeFormErrors,
  type RecipeFormValues,
  type RecipeIntent,
  readRecipeForm,
  validateRecipeForm,
} from '../../../domain/recipe-form.ts'
import { formatQuantity } from '../../../domain/format.ts'
import type { RecipeDetail } from '../../../domain/types.ts'
import { routes } from '../../../routes.ts'
import type { AppContext } from '../../../router.ts'
import type { EditorMode } from './page.tsx'

/** Prefills the editor from a stored recipe (edit, or the source of a variation). */
export function valuesFromRecipe(recipe: RecipeDetail, mode: EditorMode, categoryIds: number[]): RecipeFormValues {
  return {
    title: recipe.title,
    description: recipe.description,
    prepMinutes: String(recipe.prepMinutes),
    cookMinutes: String(recipe.cookMinutes),
    servings: String(recipe.servings),
    difficulty: recipe.difficulty,
    categoryIds,
    ingredients: recipe.ingredients.map((line) => ({
      name: line.name,
      quantity: line.quantity === null ? '' : formatQuantity(line.quantity),
      unit: line.unit ?? '',
      section: line.section ?? '',
      note: line.note ?? '',
    })),
    steps: recipe.steps.map((step) => ({
      title: step.title ?? '',
      text: step.text,
      minutes: step.minutes ? String(step.minutes) : '',
    })),
    changeSummary: mode === 'edit' ? (recipe.changeSummary ?? '') : '',
    imageUrl: recipe.imageUrl,
  }
}

export const emptyValues = (): RecipeFormValues => ({
  title: '',
  description: '',
  prepMinutes: '',
  cookMinutes: '',
  servings: '2',
  difficulty: 'mudah',
  categoryIds: [],
  ingredients: [],
  steps: [],
  changeSummary: '',
  imageUrl: null,
})

export async function categoryIdsFor(context: AppContext, recipe: RecipeDetail) {
  let categories = await listCategories(context.db)
  return categories.filter((c) => recipe.categories.includes(c.name)).map((c) => c.id)
}

/**
 * Shared POST handling: validate, store the photo, resolve ingredient names to
 * ingredient rows (creating new ones), then persist. Returns a re-rendered form
 * with errors, or the parsed write payload.
 */
export async function processSubmission(
  context: AppContext,
  isVariation: boolean,
): Promise<{ ok: false; values: RecipeFormValues; errors: RecipeFormErrors } | { ok: true; write: RecipeWrite }> {
  let form = context.formData
  let intent: RecipeIntent = form.get('aksi') === 'draf' ? 'draft' : 'publish'
  let values = readRecipeForm(form)
  let categories = await listCategories(context.db)
  let result = validateRecipeForm(values, {
    intent,
    isVariation,
    validCategoryIds: new Set(categories.map((c) => c.id)),
  })

  let imageUrl = values.imageUrl && /^(\/media\/|https:\/\/images\.unsplash\.com\/)/.test(values.imageUrl) ? values.imageUrl : null
  if (form.get('hapus_foto') === '1') imageUrl = null
  let photo = form.get('foto')
  let photoError: string | null = null
  if (isProvidedFile(photo)) {
    let stored = await storeImage(photo)
    if (stored.ok) imageUrl = stored.url
    else photoError = uploadErrorMessage(stored.error)
  }

  if (!result.ok || photoError) {
    let errors = result.ok ? { fields: {}, ingredientRows: {}, stepRows: {} } : result.errors
    if (photoError) errors.fields.image = photoError
    return { ok: false, values: { ...values, imageUrl }, errors }
  }

  let recipe: ParsedRecipe = result.recipe
  let ingredientRows = await ensureIngredients(
    context.db,
    recipe.ingredients.map((line) => line.name),
  )
  return {
    ok: true,
    write: {
      title: recipe.title,
      description: recipe.description,
      imageUrl,
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      categoryIds: recipe.categoryIds,
      steps: recipe.steps,
      ingredients: recipe.ingredients.map((line) => ({
        ingredientId: ingredientRows.get(line.name.toLowerCase())!.id,
        quantity: line.quantity,
        unit: line.unit,
        note: line.note,
        section: line.section,
      })),
      status: intent === 'draft' ? 'draft' : 'published',
      changeSummary: recipe.changeSummary,
    },
  }
}

export function flashFor(write: RecipeWrite, mode: EditorMode, recipeId: string) {
  let message =
    write.status === 'draft'
      ? 'Draf tersimpan.'
      : mode === 'variation'
        ? 'Variasi berhasil diterbitkan.'
        : mode === 'edit'
          ? 'Perubahan resep disimpan.'
          : 'Resep berhasil diterbitkan.'
  return { message, action: { label: 'Lihat', href: routes.recipes.show.href({ id: recipeId }) } }
}

