import { createFileResponse } from 'remix/response/file'
import { openLazyFile } from 'remix/fs'
import { createController } from 'remix/router'

import { assets } from '../assets.ts'
import { loadNeighborhood, mostConnectedRecipeKey } from '../data/graph.ts'
import { findIngredientsByNames } from '../data/ingredients.ts'
import { resolveMediaFile } from '../data/media.ts'
import { findPantryMatches } from '../data/pantry.ts'
import { type HomeTab, getSiteStats, listHomeRecipes } from '../data/recipes.ts'
import { DEFAULT_EDGE_KINDS } from '../domain/graph.ts'
import { routes } from '../routes.ts'
import { HomePage } from './home-page.tsx'
import { getShell } from './shell.tsx'

const HOME_TABS: HomeTab[] = ['populer', 'terbaru', 'cepat']
// Sample pantry for the homepage preview, matching the design's example.
const PREVIEW_PANTRY = ['Nasi Putih', 'Telur', 'Bawang Putih', 'Kecap Manis']
const PREVIEW_SUGGESTIONS = ['Daun Bawang', 'Cabai Merah', 'Bawang Merah']

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },

    async media(context) {
      let media = resolveMediaFile(context.params.file)
      if (!media) return new Response('Not Found', { status: 404 })
      try {
        let file = openLazyFile(media.filePath, { type: media.contentType })
        return await createFileResponse(file, context.request, {
          cacheControl: 'public, max-age=31536000, immutable',
        })
      } catch {
        return new Response('Not Found', { status: 404 })
      }
    },

    async home(context) {
      let db = context.db
      let tabParam = context.url.searchParams.get('tab')
      let tab = HOME_TABS.find((value) => value === tabParam) ?? 'populer'

      let [recipes, featuredList, stats, pantryIngredients, suggestionIngredients, graphCenter] =
        await Promise.all([
          listHomeRecipes(db, tab, 6),
          listHomeRecipes(db, 'populer', 1),
          getSiteStats(db),
          findIngredientsByNames(db, PREVIEW_PANTRY),
          findIngredientsByNames(db, PREVIEW_SUGGESTIONS),
          mostConnectedRecipeKey(db),
        ])
      let featured = featuredList[0] ?? null
      let pantry = PREVIEW_PANTRY.flatMap((name) => pantryIngredients.get(name.toLowerCase()) ?? [])
      let suggestions = PREVIEW_SUGGESTIONS.flatMap(
        (name) => suggestionIngredients.get(name.toLowerCase()) ?? [],
      )

      let [pantryMatches, graph] = await Promise.all([
        findPantryMatches(db, {
          ingredientIds: pantry.map((ingredient) => ingredient.id),
          assumeStaples: true,
          maxMinutes: null,
          difficulty: null,
        }),
        graphCenter
          ? loadNeighborhood(db, {
              center: graphCenter,
              depth: 1,
              kinds: DEFAULT_EDGE_KINDS.filter((kind) => kind !== 'substitute_for'),
            })
          : null,
      ])

      return context.render(
        <HomePage
          shell={getShell(context)}
          tab={tab}
          recipes={recipes}
          featured={featured}
          stats={stats}
          pantry={pantry}
          suggestions={suggestions}
          pantryMatches={pantryMatches.slice(0, 3)}
          pantryMatchCount={pantryMatches.length}
          graph={graph}
        />,
      )
    },
  },
})
