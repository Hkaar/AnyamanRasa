import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import {
  findIngredientsByNames,
  getIngredientsByIds,
  listIngredientsUsedWith,
  listPantryItems,
  listPopularIngredients,
  replacePantry,
  searchIngredients,
} from '../../data/ingredients.ts'
import { findPantryMatches } from '../../data/pantry.ts'
import {
  getPreferences,
  listCategoryTiles,
  replaceAvoidedIngredients,
  replaceFavoriteCategories,
  toPreferences,
} from '../../data/preferences.ts'
import { isUuid, listFeedCandidates } from '../../data/recipes.ts'
import {
  MAX_AVOIDED_INGREDIENTS,
  type OnboardingStep,
  buildFeed,
  nextStep,
  parseStep,
  pickCategoryIds,
  validateFavorites,
} from '../../domain/onboarding.ts'
import { routes } from '../../routes.ts'
import type { AppContext } from '../../router.ts'
import { MAX_PANTRY_INGREDIENTS } from '../pantry/params.ts'
import { getShell, requireViewer } from '../shell.tsx'
import { onboardingHref, OnboardingPage, type OnboardingView } from './page.tsx'

/** Category tiles offered in step 1 (15a shows six). */
const TILE_COUNT = 6
/** Ingredient photos shown around the pot in the 15b panel. */
const PANEL_INGREDIENTS = 6
/** Common ingredients people avoid, offered as chips in step 3 when they exist. */
const AVOID_SUGGESTIONS = ['Kacang Tanah', 'Udang', 'Cumi', 'Telur', 'Terasi', 'Santan', 'Tepung Terigu', 'Cabai Rawit']

interface Draft {
  categoryIds?: number[]
  ingredientIds?: string[]
  avoidedIds?: string[]
  error?: string
}

/**
 * Onboarding after sign-up (pen.dev 15a–15d). Every step is one POST form: submitting without
 * "Lanjut" (a changed checkbox, an added or removed chip) re-renders the step with the draft so
 * the preview follows along; "Lanjut" saves the step and moves on.
 */
export default createController(routes.onboarding, {
  actions: {
    async index(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      return renderStep(context, viewer.id, parseStep(context.url.searchParams.get('langkah')), {})
    },

    async action(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let db = context.db
      let form = context.formData
      let step = parseStep(form.get('langkah'))
      let advance = form.has('lanjut')
      let next = () => redirect(onboardingHref(nextStep(step)), 303)

      if (step === 'selera') {
        let tiles = await listCategoryTiles(db, TILE_COUNT)
        let categoryIds = pickCategoryIds(form.getAll('kategori'), tiles.map((tile) => tile.id))
        if (advance) {
          let error = validateFavorites(categoryIds)
          if (!error) {
            await replaceFavoriteCategories(db, viewer.id, categoryIds)
            return next()
          }
          return renderStep(context, viewer.id, step, { categoryIds, error }, 400)
        }
        return renderStep(context, viewer.id, step, { categoryIds })
      }

      if (step === 'dapur') {
        let { ids, error } = await editIngredientList(context, 'bahan', MAX_PANTRY_INGREDIENTS)
        if (advance) {
          await replacePantry(db, viewer.id, ids)
          return next()
        }
        return renderStep(context, viewer.id, step, { ingredientIds: ids, error })
      }

      if (step === 'pantangan') {
        let { ids, error } = await editIngredientList(context, 'hindari', MAX_AVOIDED_INGREDIENTS)
        if (advance) {
          await replaceAvoidedIngredients(db, viewer.id, ids)
          return next()
        }
        return renderStep(context, viewer.id, step, { avoidedIds: ids, error })
      }

      return redirect(routes.home.href(), 303)
    },
  },
})

/**
 * Applies the chip buttons of an ingredient list: `hapus` removes one, `hapus_semua` clears it,
 * `tambah_id` adds a suggestion and `tambah` resolves a typed name (exact match first).
 */
async function editIngredientList(context: AppContext, field: string, max: number) {
  let form = context.formData
  let ids = form.getAll(field).filter((value): value is string => typeof value === 'string' && isUuid(value))
  let error: string | undefined
  if (form.has('hapus_semua')) ids = []
  let removed = form.get('hapus')
  if (typeof removed === 'string') ids = ids.filter((id) => id !== removed)
  let added = form.get('tambah_id')
  if (typeof added === 'string' && isUuid(added)) ids.push(added)

  let typed = String(form.get('tambah') ?? '').trim().slice(0, 100)
  if (typed && !form.has('lanjut')) {
    let match =
      (await findIngredientsByNames(context.db, [typed])).get(typed.toLowerCase()) ??
      (await searchIngredients(context.db, typed, 1))[0]
    if (match) ids.push(match.id)
    else error = `Bahan "${typed}" belum ada di AnyamanRasa.`
  }
  return { ids: [...new Set(ids)].slice(0, max), error }
}

async function renderStep(context: AppContext, userId: string, step: OnboardingStep, draft: Draft, status = 200) {
  let db = context.db
  let saved = await getPreferences(db, userId)
  let preferences = toPreferences(saved)
  let view: OnboardingView

  if (step === 'selera') {
    let [tiles, candidates] = await Promise.all([listCategoryTiles(db, TILE_COUNT), listFeedCandidates(db)])
    let selected = draft.categoryIds ?? preferences.favoriteCategoryIds.filter((id) => tiles.some((tile) => tile.id === id))
    let feed = buildFeed(candidates, { ...preferences, favoriteCategoryIds: selected })
    view = { step, tiles, selected, shownCount: feed.shown.length }
  } else if (step === 'dapur') {
    let ids = draft.ingredientIds ?? (await listPantryItems(db, userId)).map((item) => item.id)
    let [selected, usedWith, matches] = await Promise.all([
      getIngredientsByIds(db, ids),
      listIngredientsUsedWith(db, ids, 4),
      findPantryMatches(db, { ingredientIds: ids, assumeStaples: true, maxMinutes: null, difficulty: null }),
    ])
    // Without a pantry there is nothing to pair with yet, so suggest the most-used ingredients.
    let suggestions = usedWith.length > 0 ? usedWith : await listPopularIngredients(db, 4)
    view = {
      step,
      selected,
      suggestions: suggestions.filter((ingredient) => !ids.includes(ingredient.id)),
      matchCount: matches.length,
      readyCount: matches.filter((match) => match.missing.length === 0).length,
      top: matches[0] ?? null,
      // Few ingredients have photos yet; show those first.
      panelIngredients: [...selected].sort((a, b) => Number(!a.imageUrl) - Number(!b.imageUrl)).slice(0, PANEL_INGREDIENTS),
    }
  } else if (step === 'pantangan') {
    let ids = draft.avoidedIds ?? preferences.avoidedIngredientIds
    let [chosen, known, candidates] = await Promise.all([
      getIngredientsByIds(db, ids),
      findIngredientsByNames(db, AVOID_SUGGESTIONS),
      listFeedCandidates(db),
    ])
    let suggestions = AVOID_SUGGESTIONS.flatMap((name) => known.get(name.toLowerCase()) ?? [])
    let feed = buildFeed(candidates, { ...preferences, avoidedIngredientIds: ids })
    view = {
      step,
      // A stable order: moving checked chips between submits would desync the checkboxes.
      options: [...suggestions, ...chosen.filter((ingredient) => !suggestions.some((s) => s.id === ingredient.id))],
      chosen: ids,
      avoided: chosen,
      hidden: feed.hidden.map((item) => item.recipe),
      safe: feed.shown[0] ?? null,
    }
  } else {
    let [pantry, avoided, candidates] = await Promise.all([
      listPantryItems(db, userId),
      getIngredientsByIds(db, preferences.avoidedIngredientIds),
      listFeedCandidates(db),
    ])
    let feed = buildFeed(candidates, preferences)
    view = {
      step,
      hasFavorites: saved.favoriteCategories.length > 0,
      pantryCount: pantry.length,
      avoided,
      shown: feed.shown.slice(0, 3),
    }
  }

  return context.render(<OnboardingPage shell={getShell(context)} view={view} error={draft.error} />, { status })
}
