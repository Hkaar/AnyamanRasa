import { createController } from 'remix/router'

import {
  AUTHOR_SORTS,
  type AuthorSort,
  countRecipesByAuthor,
  countSavedRecipes,
  listRecipesByAuthor,
  listSavedRecipes,
} from '../../data/recipes.ts'
import { findProfileByUsername } from '../../data/users.ts'
import type { RecipeSummary } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { getShell, notFound } from '../shell.tsx'
import { PROFILE_PAGE_SIZE, ProfileCardsChunk, type ProfileTab, ProfilePage } from './pages.tsx'

const TABS: ProfileTab[] = ['resep', 'variasi', 'disimpan']
/** Variations previewed under the recipe grid. */
const VARIATION_PREVIEW = 4

export default createController(routes.profile, {
  actions: {
    async show(context) {
      let db = context.db
      let profile = await findProfileByUsername(db, context.params.username.toLowerCase())
      if (!profile) return notFound(context, 'Pengguna ini tidak ditemukan.')

      let isOwn = context.viewer?.id === profile.id
      let params = context.url.searchParams
      let tabParam = params.get('tab')
      let tab = TABS.find((value) => value === tabParam) ?? 'resep'
      // Saved recipes are private to their owner (SKPL-NF-07.1).
      if (tab === 'disimpan' && !isOwn) tab = 'resep'
      let sortParam = params.get('urut')
      let sort: AuthorSort = AUTHOR_SORTS.find((value) => value === sortParam) ?? 'terbaru'
      let page = Math.max(1, Math.min(50, Math.floor(Number(params.get('hal'))) || 1))

      // Infinite scroll asks for one page of a tab's cards at a time.
      if (params.get('bagian') === 'kartu' && tab !== 'disimpan') {
        let options = { includeUnpublished: isOwn, kind: tab === 'variasi' ? 'variation' : 'original' } as const
        let [items, count] = await Promise.all([
          listRecipesByAuthor(db, profile.id, {
            ...options,
            sort,
            limit: PROFILE_PAGE_SIZE,
            offset: (page - 1) * PROFILE_PAGE_SIZE,
          }),
          countRecipesByAuthor(db, profile.id, options),
        ])
        return context.render(
          <ProfileCardsChunk username={profile.username} tab={tab} sort={sort} page={page} recipes={items} total={count} />,
        )
      }

      let recipes: RecipeSummary[]
      let total: number
      let variations: RecipeSummary[] = []
      if (tab === 'disimpan') {
        recipes = await listSavedRecipes(db, profile.id)
        total = recipes.length
      } else {
        let options = { includeUnpublished: isOwn, kind: tab === 'variasi' ? 'variation' : 'original' } as const
        // "Muat lebih banyak" shows every page up to the requested one.
        ;[recipes, total, variations] = await Promise.all([
          listRecipesByAuthor(db, profile.id, { ...options, sort, limit: page * PROFILE_PAGE_SIZE }),
          countRecipesByAuthor(db, profile.id, options),
          tab === 'resep'
            ? listRecipesByAuthor(db, profile.id, {
                includeUnpublished: isOwn,
                kind: 'variation',
                limit: VARIATION_PREVIEW,
              })
            : Promise.resolve([]),
        ])
      }

      // Own profile: the Gratis plan banner shows how many of the free saves are used.
      let savedCount = !isOwn ? null : tab === 'disimpan' ? total : await countSavedRecipes(db, profile.id)

      return context.render(
        <ProfilePage
          shell={getShell(context)}
          profile={profile}
          isOwn={isOwn}
          tab={tab}
          sort={sort}
          page={page}
          recipes={recipes}
          total={total}
          variations={variations}
          savedCount={savedCount}
        />,
      )
    },
  },
})
