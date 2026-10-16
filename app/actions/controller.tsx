import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'
import { Session } from 'remix/session'

import { assets } from '../assets.ts'
import { loadNeighborhood, mostConnectedRecipeKey } from '../data/graph.ts'
import { findIngredientsByNames } from '../data/ingredients.ts'
import { serveMedia } from '../data/media.ts'
import { findPantryMatches } from '../data/pantry.ts'
import { getPreferences, toPreferences } from '../data/preferences.ts'
import { type HomeTab, getSiteStats, listFeedCandidates, listHomeRecipes } from '../data/recipes.ts'
import { buildFeed, hasPreferences } from '../domain/onboarding.ts'
import { DEFAULT_EDGE_KINDS } from '../domain/graph.ts'
import { OAUTH_VERIFIER_KEY } from './auth/sign-in.ts'
import { routes } from '../routes.ts'
import { HomePage } from './home-page.tsx'
import { getShell } from './shell.tsx'
import type { Database } from '../db.ts'

const HOME_TABS: HomeTab[] = ['populer', 'terbaru', 'cepat']
// Sample pantry for the homepage preview, matching the design's example.
const PREVIEW_PANTRY = ['Nasi Putih', 'Telur', 'Bawang Putih', 'Kecap Manis']
const PREVIEW_SUGGESTIONS = ['Daun Bawang', 'Cabai Merah', 'Bawang Merah']

export default createController(routes, {
  actions: {
    async assets(context) {
      return (await assets.fetch(context.request)) ?? new Response('Not Found', { status: 404 })
    },

    media(context) {
      return serveMedia(context.params.file, context.request)
    },

    async home(context) {
      // Supabase falls back to the Site URL (this page) when the callback is missing from its
      // Redirect URLs allow-list. The code is still valid: finish the sign-in this browser started.
      let oauthCode = context.url.searchParams.get('code')
      if (oauthCode && typeof context.get(Session)?.get(OAUTH_VERIFIER_KEY) === 'string') {
        console.warn(
          'Google sign-in returned to "/" instead of the callback: add it to Supabase Auth → URL Configuration → Redirect URLs.',
        )
        let callback = new URL(routes.auth.googleCallback.href(), context.url)
        callback.searchParams.set('code', oauthCode)
        return redirect(`${callback.pathname}${callback.search}`, 303)
      }

      let db = context.db
      let tabParam = context.url.searchParams.get('tab')
      let tab = HOME_TABS.find((value) => value === tabParam) ?? 'populer'
      let forYou = context.viewer ? await loadForYou(db, context.viewer.id) : null

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
          forYou={forYou}
          forYouActive={forYou !== null && tabParam === 'untukmu'}
        />,
      )
    },
  },
})

/** The "Untukmu" tab (onboarding preferences), or null when the viewer has none. */
async function loadForYou(db: Database, userId: string) {
  let preferences = toPreferences(await getPreferences(db, userId))
  if (!hasPreferences(preferences)) return null
  return buildFeed(await listFeedCandidates(db), preferences).shown.slice(0, 6)
}
