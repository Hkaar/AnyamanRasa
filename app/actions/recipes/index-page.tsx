import type { Handle } from 'remix/component'

import type { Category, RecipeFilters, RecipeSort } from '../../data/recipes.ts'
import { difficultyLabel, formatCount } from '../../domain/format.ts'
import { DIFFICULTIES, type RecipeSummary } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { Icon } from '../../ui/icon.tsx'
import { SiteLayout } from '../../ui/layout.tsx'
import { LoadMore, LoadMoreChunk } from '../../ui/load-more.tsx'
import { Select } from '../../ui/select.tsx'
import { RecipeCard } from '../../ui/recipe-card.tsx'
import type { Shell } from '../../ui/shell.ts'
import { DURATION_OPTIONS, filtersToParams, hasActiveFilters } from './filters.ts'
import { Button, ButtonLink } from '../../ui/button.tsx'
import { badgeVariants } from '../../ui/badge.tsx'
import { cn, pageX } from '../../ui/utils.ts'

export interface RecipeIndexPageProps {
  shell: Shell
  filters: RecipeFilters
  categories: (Category & { count: number })[]
  recipes: RecipeSummary[]
  total: number
}

const SORT_LABELS: Record<RecipeSort, string> = {
  relevan: 'Paling relevan',
  populer: 'Terpopuler',
  terbaru: 'Terbaru',
  tercepat: 'Tercepat',
}

export function RecipeIndexPage(handle: Handle<RecipeIndexPageProps>) {
  return () => {
    let { shell, filters, categories, recipes, total } = handle.props
    let base = routes.recipes.index.href()
    let selectedCategories = categories.filter((c) => filters.categoryIds.includes(c.id))
    let [featureA, featureB, ...rest] = recipes
    let shown = recipes.length
    let hrefWith = (overrides: Partial<RecipeFilters>) => recipesHref(filters, overrides)

    return (
      <SiteLayout
        shell={shell}
        active="recipes"
        title={filters.query ? `Cari “${filters.query}”` : 'Jelajahi Resep'}
      >
        <form method="get" action={base} data-autosubmit class={cn(pageX, 'flex flex-col gap-8 pt-10 pb-8 lg:gap-12 lg:pt-[104px] lg:pb-12')}>
          <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end lg:gap-10">
            <div class="flex max-w-[560px] flex-col gap-4 lg:gap-6">
              <h1 class="text-[44px] leading-none font-normal tracking-[-0.44px] lg:text-[88px] lg:leading-[92px] lg:tracking-[-0.88px]">
                Jelajahi Resep
              </h1>
              <p class="text-[15px] leading-normal tracking-[0.02em] text-muted lg:text-[18px] lg:leading-[27px]">
                Ribuan resep rumahan dari seluruh Nusantara. Saring berdasarkan kategori, waktu
                memasak, dan tingkat kesulitan.
              </p>
            </div>
            <div
              role="search"
              class="flex h-[52px] w-full items-center gap-2.5 rounded-md border border-outline bg-bg pr-2 pl-4 focus-within:border-ink lg:w-[480px]"
            >
              <Icon name="search" size={18} class="text-muted" />
              <label for="recipe-search" class="sr-only">
                Cari nama resep atau bahan
              </label>
              <input
                id="recipe-search"
                type="search"
                name="q"
                value={filters.query}
                placeholder="Cari nama resep atau bahan…"
                class="h-full min-w-0 flex-1 bg-transparent text-[15px] tracking-[0.02em] placeholder:text-faint focus:outline-none"
              />
              <Button type="submit" variant="default" class="h-9 px-[18px]">
                Cari
              </Button>
            </div>
          </div>

          <div class="flex flex-col gap-5 border-t border-line pt-6">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-center gap-2">
                <details class="group relative" data-pop>
                  <summary
                    class={cn(
                      'flex h-10 cursor-pointer list-none items-center gap-2 rounded-md border pr-3.5 pl-4 text-[13px] [&::-webkit-details-marker]:hidden',
                      selectedCategories.length > 0
                        ? 'border-surface-dark bg-surface-dark text-white hover:bg-ink'
                        : 'border-outline bg-bg hover:bg-subtle',
                    )}
                  >
                    <span class={selectedCategories.length > 0 ? 'text-white' : 'text-muted'}>Kategori</span>
                    <span class="font-medium">{categorySummary(selectedCategories)}</span>
                    <Icon
                      name="chevron-down"
                      class={cn('group-open:rotate-180', selectedCategories.length > 0 ? 'text-white' : 'text-muted')}
                    />
                  </summary>
                  <fieldset class="absolute top-[calc(100%+6px)] left-0 z-30 grid max-h-80 w-64 overflow-y-auto rounded-lg border border-line-strong bg-bg p-1.5 shadow-modal">
                    <legend class="sr-only">Kategori</legend>
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        class="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-sm hover:bg-hover"
                      >
                        <input
                          type="checkbox"
                          name="kategori"
                          value={String(category.id)}
                          checked={filters.categoryIds.includes(category.id)}
                          class="size-4 accent-ink"
                        />
                        <span class="flex-1">{category.name}</span>
                        <span class="text-xs text-muted">{category.count}</span>
                      </label>
                    ))}
                  </fieldset>
                </details>

                <Select
                  label="Durasi"
                  name="durasi"
                  value={filters.maxMinutes === null ? '' : String(filters.maxMinutes)}
                  options={[
                    { value: '', label: 'Semua' },
                    ...DURATION_OPTIONS.map((minutes) => ({ value: String(minutes), label: `≤\u00a0${minutes}\u00a0menit` })),
                  ]}
                />

                <Select
                  label="Kesulitan"
                  name="kesulitan"
                  value={filters.difficulties[0] ?? ''}
                  options={[
                    { value: '', label: 'Semua' },
                    ...DIFFICULTIES.map((difficulty) => ({ value: difficulty, label: difficultyLabel(difficulty) })),
                  ]}
                />

                <noscript>

                  <Button type="submit" variant="outline">Terapkan</Button>

                </noscript>

                {hasActiveFilters(filters) && (
                  <>
                    <span class="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
                    <ButtonLink href={base} variant="ghost" size="sm" class="h-auto px-2.5 py-2 text-muted">
                      <Icon name="x" size={14} />
                      Hapus filter
                    </ButtonLink>
                  </>
                )}
              </div>
              <div class="flex items-center gap-4">
                <p class="text-[13px] text-muted" aria-live="polite">
                  {formatCount(total)} resep ditemukan
                </p>
                <Select
                  label="Urutkan"
                  name="urut"
                  align="end"
                  value={filters.sort}
                  options={(Object.keys(SORT_LABELS) as RecipeSort[])
                    .filter((sort) => sort !== 'relevan' || filters.query)
                    .map((sort) => ({ value: sort, label: SORT_LABELS[sort] }))}
                />
              </div>
            </div>

            {selectedCategories.length > 0 && (
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[13px] text-faint">Aktif:</span>
                {selectedCategories.map((category) => (
                  <a
                    key={category.id}
                    href={hrefWith({ categoryIds: filters.categoryIds.filter((id) => id !== category.id) })}
                    class={cn(
                      badgeVariants({ variant: 'selected' }),
                      'h-auto border-surface-dark bg-surface-dark py-2 pr-3 pl-4 hover:bg-ink',
                    )}
                    aria-label={`Hapus filter ${category.name}`}
                  >
                    {category.name}
                    <Icon name="x" size={14} class="text-white/70" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </form>

        <section aria-label="Hasil resep" class="bg-hover">
          <div class={cn(pageX, 'flex flex-col gap-12 pt-10 pb-20 lg:gap-16 lg:pt-20 lg:pb-32')}>
          {recipes.length === 0 ? (
            <div
              data-slot="empty"
              class="mx-auto flex w-full max-w-[440px] flex-col items-center gap-4 rounded-lg bg-surface-dark px-8 py-16 text-center"
            >
              <span data-slot="empty-media" class="flex size-14 items-center justify-center rounded-full bg-white/8 text-white">
                <Icon name="search-x" size={22} />
              </span>
              <h2 data-slot="empty-title" class="text-[28px] leading-[31px] font-normal tracking-[-0.28px] text-white">
                Tidak ada resep yang cocok
              </h2>
              <p data-slot="empty-description" class="text-[15px] leading-[23px] tracking-[0.02em] text-line-strong">
                {emptyDescription(filters, selectedCategories)}
              </p>
              <ButtonLink href={base} variant="default" class="h-auto rounded-full px-6 py-3.5 text-[15px]">
                Hapus filter
              </ButtonLink>
            </div>
          ) : (
            <>
              <div
                class="grid gap-x-8 gap-y-10 rounded-lg bg-bg bg-linear-260 from-[#f3e6d8]/75 from-5% to-sand/75 to-95% p-4 md:grid-cols-2 lg:p-8"
                data-reveal-group
              >
                {[featureA, featureB].map(
                  (recipe) => recipe && <RecipeCard key={recipe.id} recipe={recipe} size="feature" headingLevel={2} />,
                )}
              </div>
              {rest.length > 0 && (
                <div
                  id="hasil-resep"
                  class="grid grid-cols-2 gap-x-3.5 gap-y-8 md:gap-x-6 md:gap-y-12 lg:grid-cols-4 lg:gap-y-16"
                  data-reveal-group
                >
                  {rest.map((recipe) => (
                    <RecipeCard key={recipe.id} recipe={recipe} headingLevel={2} />
                  ))}
                </div>
              )}
              <LoadMore
                listId="hasil-resep"
                shown={shown}
                total={total}
                countLabel={(count) => resultCount(count, total)}
                href={hrefWith({ page: filters.page + 1 })}
                fragmentHref={recipeCardsHref(filters, filters.page + 1)}
              />
            </>
          )}
          </div>
        </section>
      </SiteLayout>
    )
  }
}

function recipesHref(filters: RecipeFilters, overrides: Partial<RecipeFilters> = {}): string {
  let base = routes.recipes.index.href()
  let query = filtersToParams(filters, { page: 1, ...overrides }).toString()
  return query ? `${base}?${query}` : base
}

/** One page of result cards only (infinite scroll), rendered by <RecipeCardsChunk>. */
export function recipeCardsHref(filters: RecipeFilters, page: number): string {
  let params = filtersToParams(filters, { page })
  params.set('bagian', 'kartu')
  return `${routes.recipes.index.href()}?${params}`
}

function resultCount(shown: number, total: number): string {
  return `Menampilkan ${formatCount(shown)} dari ${formatCount(total)} resep`
}

/** Fragment for infinite scroll: the cards of `filters.page` and the next page's links. */
export function RecipeCardsChunk(handle: Handle<{ filters: RecipeFilters; recipes: RecipeSummary[]; total: number }>) {
  return () => {
    let { filters, recipes, total } = handle.props
    let shown = Math.min(total, (filters.page - 1) * filters.pageSize + recipes.length)
    let more = shown < total && recipes.length > 0
    return (
      <LoadMoreChunk
        countLabel={resultCount(shown, total)}
        next={more ? recipeCardsHref(filters, filters.page + 1) : undefined}
        nextHref={more ? recipesHref(filters, { page: filters.page + 1 }) : undefined}
      >
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} headingLevel={2} />
        ))}
      </LoadMoreChunk>
    )
  }
}

function categorySummary(selected: Category[]): string {
  if (selected.length === 0) return 'Semua'
  if (selected.length <= 2) return selected.map((c) => c.name).join(', ')
  return `${selected[0]!.name}, ${selected[1]!.name} +${selected.length - 2}`
}

function emptyDescription(filters: RecipeFilters, categories: Category[]): string {
  let parts = [
    ...categories.map((c) => c.name),
    ...filters.difficulties.map(difficultyLabel),
    ...(filters.maxMinutes !== null ? [`≤\u00a0${filters.maxMinutes}\u00a0menit`] : []),
  ]
  let subject = filters.query ? `Belum ada resep “${filters.query}”` : 'Belum ada resep'
  let withFilters = parts.length > 0 ? ` dengan filter ${parts.join(' · ')}` : ''
  return `${subject}${withFilters}. Coba kata kunci lain atau kurangi filter.`
}
