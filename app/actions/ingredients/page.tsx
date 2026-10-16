import type { Handle } from 'remix/component'

import type { CoOccurrence, IngredientDetail } from '../../data/ingredients.ts'
import type { Category } from '../../data/recipes.ts'
import { formatCount } from '../../domain/format.ts'
import type { ExplicitRelation, RecipeSummary } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { Icon } from '../../ui/icon.tsx'
import { SiteLayout } from '../../ui/layout.tsx'
import { CsrfField } from '../../ui/primitives.tsx'
import { RecipeCard } from '../../ui/recipe-card.tsx'
import type { Shell } from '../../ui/shell.ts'
import { Button, ButtonLink, buttonVariants } from '../../ui/button.tsx'
import { badgeVariants } from '../../ui/badge.tsx'
import { cn, eyebrow, pageX } from '../../ui/utils.ts'
import { Breadcrumb } from '../../ui/breadcrumb.tsx'
import { Empty } from '../../ui/empty.tsx'
import { tabsListClass, tabsTriggerClass } from '../../ui/tabs.tsx'

export interface IngredientPageProps {
  shell: Shell
  ingredient: IngredientDetail
  recipes: RecipeSummary[]
  /** Top categories among this ingredient's recipes (the recipe tabs). */
  categories: Category[]
  activeCategoryId: number | null
  pairings: CoOccurrence[]
  substitutes: ExplicitRelation[]
  substituteFor: ExplicitRelation[]
  pairsWith: ExplicitRelation[]
  inPantry: boolean
}

export function IngredientPage(handle: Handle<IngredientPageProps>) {
  return () => {
    let { shell, ingredient, recipes, categories, activeCategoryId, pairings, substitutes, substituteFor, pairsWith, inPantry } = handle.props
    let name = ingredient.name
    let lower = name.toLowerCase()
    let recipeSearch = `${routes.recipes.index.href()}?q=${encodeURIComponent(name)}`
    let pageHref = routes.ingredients.show.href({ id: ingredient.id })
    let tabs = [{ id: null as number | null, name: 'Semua' }, ...categories]

    return (
      <SiteLayout shell={shell} title={name} description={ingredient.description || undefined}>
        <div class={cn(pageX, 'flex flex-col gap-10 pt-6 pb-16 lg:gap-[72px] lg:pt-9 lg:pb-[136px]')}>
          <Breadcrumb
            items={[
              { label: 'Beranda', href: routes.home.href() },
              { label: 'Bahan', href: routes.pantry.index.href() },
              { label: name },
            ]}
          />

          <div class="grid items-center gap-8 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-14">
            <div class="-mx-5 -mt-5 aspect-[390/270] overflow-hidden bg-subtle md:-mx-10 lg:mx-0 lg:mt-0 lg:aspect-[560/460] lg:rounded-lg">
              {ingredient.imageUrl ? (
                <img src={ingredient.imageUrl} alt={name} class="size-full object-cover" />
              ) : (
                <div class="flex size-full items-center justify-center text-accent">
                  <Icon name="leaf" size={56} strokeWidth={1.25} />
                </div>
              )}
            </div>
            <div class="flex flex-col gap-6 lg:gap-7">
              <h1 class="text-5xl leading-none font-normal tracking-[-0.5px] lg:text-[88px] lg:leading-[92px] lg:tracking-[-0.88px]">{name}</h1>
              <div class="flex flex-wrap gap-1.5">
                <span class={cn(badgeVariants(), 'bg-bg px-3.5 py-1.5 text-[13px]')}>Bahan</span>
              </div>
              {ingredient.description && (
                <p class="text-base leading-[1.5] tracking-[0.02em] text-muted lg:text-lg">{ingredient.description}</p>
              )}
              <dl class="flex border-y border-line py-5 lg:py-6">
                <div class="flex flex-1 flex-col gap-1.5">
                  <dt class="text-xs text-muted">Muncul di</dt>
                  <dd class="text-lg tracking-[-0.2px] lg:text-xl">{formatCount(ingredient.recipeCount)} resep</dd>
                </div>
                <div class="flex flex-1 flex-col gap-1.5 border-l border-line pl-5">
                  <dt class="text-xs text-muted">Pengganti tercatat</dt>
                  <dd class="text-lg tracking-[-0.2px] lg:text-xl">{substitutes.length} bahan</dd>
                </div>
              </dl>
              <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <ButtonLink href={`${routes.pantry.index.href()}?bahan=${ingredient.id}`} variant="default" size="lg">
                  <Icon name="refrigerator" />
                  Masak dengan {name}
                </ButtonLink>
                <ButtonLink href={`${routes.graph.index.href()}?simpul=ingredient:${ingredient.id}`} variant="dark" size="lg">
                  <Icon name="waypoints" />
                  Lihat di graf
                </ButtonLink>
                {shell.viewer &&
                  (inPantry ? (
                    <span class={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'text-accent-strong')}>
                      <Icon name="check" />
                      Ada di dapurku
                    </span>
                  ) : (
                    <form method="post" action={routes.ingredients.addToPantry.href({ id: ingredient.id })}>
                      <CsrfField token={shell.csrfToken} />
                      <Button type="submit" variant="ghost" size="lg" class="w-full sm:w-auto">
                        <Icon name="plus" />
                        Tambah ke dapurku
                      </Button>
                    </form>
                  ))}
              </div>
            </div>
          </div>

          <section aria-labelledby="resep-bahan" class="flex flex-col gap-6 lg:gap-8 lg:pt-10">
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div class="flex flex-col gap-2 lg:gap-3">
                <h2 id="resep-bahan" class="text-[32px] leading-[1.1] font-normal tracking-[-0.3px] lg:text-6xl lg:leading-[66px] lg:tracking-[-0.6px]">
                  Resep dengan {name}
                </h2>
                <p class="text-[15px] leading-normal text-muted">
                  {formatCount(ingredient.recipeCount)} resep memakai {lower} sebagai bahan utama atau pelengkap.
                </p>
              </div>
              {ingredient.recipeCount > recipes.length && (
                <ButtonLink href={recipeSearch} variant="ghost" size="lg">
                  Lihat semua {formatCount(ingredient.recipeCount)} resep
                  <Icon name="arrow-right" />
                </ButtonLink>
              )}
            </div>
            {categories.length > 0 && (
              <nav aria-label="Kategori resep" class={cn(tabsListClass, 'overflow-x-auto')}>
                {tabs.map((tab) => {
                  let active = tab.id === activeCategoryId
                  return (
                    <a
                      key={String(tab.id)}
                      href={tab.id === null ? pageHref : `${pageHref}?kategori=${tab.id}#resep-bahan`}
                      aria-current={active ? 'page' : undefined}
                      class={tabsTriggerClass(active, 'shrink-0 whitespace-nowrap')}
                    >
                      {tab.name}
                    </a>
                  )
                })}
              </nav>
            )}
            {recipes.length > 0 ? (
              <div class="grid grid-cols-2 gap-x-3.5 gap-y-8 md:gap-x-6 lg:grid-cols-4" data-reveal-group>
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <Empty title="Belum ada resep" description={`Belum ada resep terbit yang memakai ${lower}.`} icon="book-open" />
            )}
          </section>

          <div class="grid gap-4 lg:grid-cols-2 lg:gap-6 lg:pt-10" data-reveal-group>
            <section
              aria-labelledby="dipadukan"
              class="flex flex-col gap-4 rounded-lg bg-[linear-gradient(-115deg,#f3e6d8bf_12%,#d7b89abf_88%)] p-6 lg:gap-5 lg:p-10"
            >
              <div class="flex flex-col gap-2 lg:gap-5">
                <h2 id="dipadukan" class="text-[28px] leading-[1.1] font-normal tracking-[-0.3px] lg:text-4xl lg:leading-10 lg:tracking-[-0.36px]">
                  Sering dipadukan
                </h2>
                <p class="text-sm leading-normal text-ink">Persentase resep dengan {lower} yang juga memakai bahan ini.</p>
              </div>
              {pairings.length > 0 ? (
                <ul>
                  {pairings.map((pairing) => (
                    <li key={pairing.id} class="border-b border-surface-dark/10">
                      <a
                        href={routes.ingredients.show.href({ id: pairing.id })}
                        class="flex min-h-[50px] items-center gap-3 rounded-xs py-3.5 transition-colors hover:bg-white/30 lg:gap-4"
                      >
                        <span class="flex min-w-0 flex-1 items-center gap-2.5">
                          <span class="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-bg text-accent">
                            <Icon name="leaf" size={13} />
                          </span>
                          <span class="truncate text-[15px] font-medium">{pairing.name}</span>
                        </span>
                        <span class="hidden h-1.5 w-[180px] rounded-full bg-white/60 sm:block" aria-hidden="true">
                          <span class="block h-1.5 origin-left rounded-full bg-accent" data-grow style={{ width: `${pairing.percent}%` }} />
                        </span>
                        <span class="w-10 text-right text-[13px] text-ink">{pairing.percent}%</span>
                        <Icon name="arrow-up-right" class="text-ink" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="text-sm leading-normal text-ink/70">Belum cukup resep untuk menghitung bahan pendamping.</p>
              )}
              {pairsWith.length > 0 && (
                <div class="flex flex-col gap-2 pt-2">
                  <p class={cn(eyebrow, 'text-ink/70')}>Pasangan tercatat</p>
                  <ul class="flex flex-col gap-1.5">
                    {pairsWith.map((relation) => (
                      <li key={relation.id} class="text-sm">
                        <a href={routes.ingredients.show.href({ id: relation.other.id })} class="font-medium hover:underline">
                          {relation.other.name}
                        </a>
                        {relation.label && <span class="text-ink/70"> · {relation.label}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section aria-labelledby="pengganti" class="flex flex-col gap-4 rounded-lg bg-surface-dark p-6 text-white lg:gap-5 lg:p-10">
              <div class="flex flex-col gap-2 lg:gap-5">
                <h2 id="pengganti" class="text-[28px] leading-[1.1] font-normal tracking-[-0.3px] lg:text-4xl lg:leading-10 lg:tracking-[-0.36px]">
                  Pengganti {name}
                </h2>
                <p class="text-sm leading-normal text-line-strong">Pilih pengganti sesuai fungsi {lower} di resepmu.</p>
              </div>
              {substitutes.length > 0 ? (
                <table class="w-full text-left">
                  <thead>
                    <tr class="border-b border-white/15 text-xs text-line-strong">
                      <th scope="col" class="pb-2.5 font-medium">Pengganti</th>
                      <th scope="col" class="pb-2.5 font-medium">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {substitutes.map((relation) => (
                      <tr key={relation.id} class="border-b border-white/15">
                        <th scope="row" class="py-4 pr-4 align-top font-medium">
                          <a href={routes.ingredients.show.href({ id: relation.other.id })} class="flex items-center gap-2.5 text-[15px] hover:underline">
                            <Icon name="arrow-left-right" size={15} class="text-sand" />
                            {relation.other.name}
                          </a>
                        </th>
                        <td class="py-4 text-[15px] leading-[23px] tracking-[0.02em] text-line-strong">{relation.label ?? '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p class="text-sm leading-normal text-line-strong">Belum ada pengganti yang tercatat untuk {lower}.</p>
              )}
              {substituteFor.length > 0 && (
                <p class="flex gap-2.5 rounded-md bg-white/[0.08] px-[18px] py-3 text-[13px] leading-[19px] text-sand">
                  <Icon name="info" class="mt-0.5" />
                  <span>
                    {name} juga bisa menggantikan{' '}
                    {substituteFor.map((relation, index) => (
                      <>
                        {index > 0 && ', '}
                        <a href={routes.ingredients.show.href({ id: relation.other.id })} class="font-medium underline underline-offset-2">
                          {relation.other.name}
                        </a>
                      </>
                    ))}
                    .
                  </span>
                </p>
              )}
            </section>
          </div>
        </div>
      </SiteLayout>
    )
  }
}
