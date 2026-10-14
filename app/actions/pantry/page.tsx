import type { Handle, RemixNode } from 'remix/component'

import type { PantryRecipe } from '../../data/pantry.ts'
import { difficultyLabel, formatCategories, formatMinutes } from '../../domain/format.ts'
import { type PantryIngredient, type PantryMatch, STAPLE_INGREDIENT_NAMES } from '../../domain/pantry.ts'
import { DIFFICULTIES, type IngredientSummary } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { Icon } from '../../ui/icon.tsx'
import { Select, type SelectOption } from '../../ui/select.tsx'
import { SiteLayout } from '../../ui/layout.tsx'
import { CsrfField, MetaItem } from '../../ui/primitives.tsx'
import type { Shell } from '../../ui/shell.ts'
import { INITIAL_RESULTS, PANTRY_DURATIONS, type PantryParams, pantryHref } from './params.ts'
import { CHOSEN_ID, IngredientCombobox } from './public/ingredient-combobox.tsx'
import { Button, ButtonLink, buttonVariants } from '../../ui/button.tsx'
import { labelClass } from '../../ui/label.tsx'
import { badgeVariants } from '../../ui/badge.tsx'
import { cn, pageX } from '../../ui/utils.ts'
import { Empty } from '../../ui/empty.tsx'

export interface PantryPageProps {
  shell: Shell
  state: PantryParams
  selected: PantryIngredient[]
  quickAdd: IngredientSummary[]
  matches: PantryMatch<PantryRecipe>[]
  savedRecipeIds: string[]
  usingSavedPantry: boolean
}

export function PantryPage(handle: Handle<PantryPageProps>) {
  return () => {
    let { shell, state, selected, quickAdd, matches, savedRecipeIds, usingSavedPantry } = handle.props
    let base = routes.pantry.index.href()
    let href = (overrides: Partial<PantryParams>) => pantryHref(base, state, overrides)
    let visible = state.showAll ? matches : matches.slice(0, INITIAL_RESULTS)
    let hidden = matches.length - visible.length

    let staplesToggle = (
      <label class="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[19px] tracking-[0.02em] text-muted lg:items-center lg:leading-normal lg:tracking-normal lg:text-ink">
        <input type="hidden" name="pokok" value="0" />
        <input
          type="checkbox"
          name="pokok"
          value="1"
          checked={state.assumeStaples}
          class="size-5 shrink-0 accent-accent lg:size-[18px]"
        />
        Anggap bumbu dasar tersedia ({STAPLE_INGREDIENT_NAMES.join(', ')})
      </label>
    )
    let filterHidden = () => (
      <>
        {state.ingredientIds.map((id) => (
          <input key={id} type="hidden" name="bahan" value={id} />
        ))}
        {!state.assumeStaples && <input type="hidden" name="pokok" value="0" />}
      </>
    )
    let minutesValue = state.maxMinutes === null ? '' : String(state.maxMinutes)
    let minutesOptions: SelectOption[] = [
      { value: '', label: 'Semua' },
      ...PANTRY_DURATIONS.map((minutes) => ({ value: String(minutes), label: `≤ ${minutes} menit` })),
    ]
    let difficultyOptions: SelectOption[] = [
      { value: '', label: 'Semua' },
      ...DIFFICULTIES.map((difficulty) => ({ value: difficulty, label: difficultyLabel(difficulty) })),
    ]
    let activeFilters = (state.maxMinutes !== null ? 1 : 0) + (state.difficulty ? 1 : 0)

    return (
      <SiteLayout shell={shell} active="pantry" title="Cari dari Bahan">
        <div class={cn(pageX, 'flex flex-col gap-8 pt-7 pb-14 lg:gap-20 lg:pt-[104px] lg:pb-[136px]')}>
          <div class="flex flex-col gap-2.5 lg:gap-5">
            <h1 class="text-4xl leading-10 font-normal tracking-[-0.36px] lg:text-[88px] lg:leading-[92px] lg:tracking-[-0.88px]">
              Masak Apa Hari Ini?
            </h1>
            <p class="max-w-[620px] text-[15px] leading-[23px] tracking-[0.02em] text-muted lg:text-[19px] lg:leading-[29px]">
              <span class="lg:hidden">Masukkan bahan di dapurmu, kami carikan resep yang paling cocok.</span>
              <span class="hidden lg:inline">
                Masukkan bahan yang ada di dapurmu. Kami urutkan resep dari yang paling cocok, lengkap
                dengan bahan yang kurang dan penggantinya.
              </span>
            </p>
          </div>

          {/* Composer */}
          <form
            method="get"
            action={base}
            data-autosubmit
            class="grid grid-cols-[minmax(0,1fr)] gap-6 rounded-lg bg-subtle p-5 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:gap-10 lg:bg-[linear-gradient(-97.5deg,#f3e6d8bf_4.4%,#d7b89abf_95.6%)] lg:p-10"
          >
            {state.ingredientIds.map((id) => (
              <input key={id} type="hidden" name="bahan" value={id} />
            ))}
            {state.maxMinutes !== null && <input type="hidden" name="waktu" value={String(state.maxMinutes)} />}
            {state.difficulty && <input type="hidden" name="kesulitan" value={state.difficulty} />}

            <div class="flex min-w-0 flex-col gap-5">
              <IngredientCombobox
                name="tambah"
                label="Tambahkan bahan yang kamu punya"
                placeholder="Ketik nama bahan, misal: telur"
                submitLabel="Tambah"
                searchUrl={routes.ingredients.search.href()}
                selectedIds={state.ingredientIds}
                chooseHref={href({ ingredientIds: [...state.ingredientIds, CHOSEN_ID] })}
                hint="Tekan Enter untuk menambah · pisahkan beberapa bahan dengan koma"
              />
              <noscript>
                <Button type="submit" variant="outline" class="self-start">Terapkan</Button>
              </noscript>
            </div>

            <div class="flex min-w-0 flex-col gap-6">
              <div class="flex flex-col gap-3 lg:gap-3.5">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <h2 class="text-[15px] font-medium tracking-[0.01em] lg:tracking-normal">Bahan kamu</h2>
                    <span class={cn(badgeVariants(), 'lg:bg-bg lg:px-3.5 lg:py-1.5 lg:text-[13px]')}>
                      {selected.length}
                      <span class="hidden lg:inline"> bahan</span>
                    </span>
                  </div>
                  {selected.length > 0 && (
                    <ButtonLink href={`${base}?kosong=1`} variant="ghost" size="sm" class="h-[33px] px-1 font-normal text-muted lg:h-[29px] lg:px-2.5">
                      <Icon name="trash-2" size={14} class="hidden lg:block" />
                      Hapus semua
                    </ButtonLink>
                  )}
                </div>
                {selected.length > 0 ? (
                  <ul class="flex flex-wrap gap-2">
                    {selected.map((ingredient) => (
                      <li key={ingredient.id}>
                        <a
                          href={href({ ingredientIds: state.ingredientIds.filter((id) => id !== ingredient.id) })}
                          class={cn(
                            badgeVariants({ variant: 'chip' }),
                            'h-[38px] gap-2 pr-3 pl-3.5 text-sm hover:bg-hover lg:h-[34px] lg:gap-1.5 lg:border-surface-dark lg:bg-surface-dark lg:pr-2.5 lg:text-white lg:hover:bg-ink',
                          )}
                          aria-label={`Hapus ${ingredient.name}`}
                        >
                          {ingredient.name}
                          <Icon name="x" size={16} class="text-muted lg:size-3.5 lg:text-white/70" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p class="leading-normal text-[13px] text-muted">Belum ada bahan. Tambahkan dari kolom di samping atau pilih cepat di bawah.</p>
                )}
                {shell.viewer && selected.length > 0 && (
                  <p class="text-xs text-muted">
                    {usingSavedPantry ? 'Dimuat dari dapurmu. ' : ''}
                    <button
                      type="submit"
                      form="simpan-dapur"
                      class="cursor-pointer underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink"
                    >
                      Simpan sebagai dapurku
                    </button>
                  </p>
                )}
              </div>

              <div class="flex flex-col gap-3 lg:gap-3.5 lg:border-t lg:border-surface-dark/8 lg:pt-6">
                <p class="flex flex-wrap items-baseline gap-2">
                  <span class="text-[15px] font-medium tracking-[0.01em] lg:tracking-normal">Tambah cepat</span>
                  <span class="hidden text-[13px] text-ink lg:inline">bahan yang paling sering dipakai</span>
                </p>
                <ul class="-mx-5 flex gap-2 overflow-x-auto px-5 md:-mx-10 md:px-10 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
                  {quickAdd.map((ingredient) => (
                    <li key={ingredient.id} class="shrink-0">
                      <a
                        href={href({ ingredientIds: [...state.ingredientIds, ingredient.id] })}
                        class={cn(
                          badgeVariants({ variant: 'chip-muted' }),
                          'h-[38px] pr-3 pl-3.5 text-sm hover:bg-hover hover:text-ink lg:h-[34px] lg:bg-hover lg:text-ink lg:hover:bg-hover-strong lg:pl-4',
                        )}
                      >
                        {ingredient.name}
                        <Icon name="plus" size={16} class="lg:size-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {staplesToggle}
            </div>
          </form>
          {shell.viewer && (
            <form id="simpan-dapur" method="post" action={routes.pantry.save.href()} hidden>
              <CsrfField token={shell.csrfToken} />
              {state.ingredientIds.map((id) => (
                <input key={id} type="hidden" name="bahan" value={id} />
              ))}
            </form>
          )}
          {/* Owner of the mobile filter panel's selects (they sit inside the toolbar form below). */}
          <form id="filter-seluler" method="get" action={base} data-autosubmit hidden>
            {filterHidden()}
          </form>

          {/* Results */}
          <section aria-labelledby="hasil" class="flex flex-col pt-2 lg:pt-0">
            <div class="flex flex-col justify-between gap-3.5 pb-4 lg:flex-row lg:items-end lg:gap-4 lg:pb-10">
              <div class="flex flex-col gap-2">
                <h2 id="hasil" class="text-[26px] leading-[30px] font-normal tracking-[-0.26px] lg:text-[60px] lg:leading-[66px] lg:tracking-[-0.6px]" aria-live="polite">
                  {selected.length === 0 ? 'Pilih bahan untuk mulai' : `${matches.length} resep bisa kamu masak`}
                </h2>
                {selected.length > 0 && (
                  <p class="hidden text-[15px] leading-normal text-muted lg:block">Diurutkan dari bahan yang paling banyak cocok dengan isi dapurmu.</p>
                )}
              </div>
              <form method="get" action={base} data-autosubmit class="flex items-center gap-2">
                {filterHidden()}
                <details class="group relative lg:hidden" data-pop>
                  <summary
                    class={cn(
                      buttonVariants({ variant: 'outline' }),
                      'h-10 gap-2 px-3.5 text-[13px] list-none group-open:bg-hover [&::-webkit-details-marker]:hidden',
                    )}
                  >
                    <Icon name="sliders-horizontal" />
                    Filter
                    {activeFilters > 0 && <span class={badgeVariants({ variant: 'accent' })}>{activeFilters}</span>}
                  </summary>
                  <div class="absolute top-[calc(100%+6px)] left-0 z-30 flex w-[calc(100vw-40px)] max-w-[350px] flex-col gap-3 rounded-md border border-line-strong bg-bg p-3 shadow-modal">
                    <div class="flex flex-col gap-1.5">
                      <span class={labelClass}>Waktu</span>
                      <Select variant="field" ariaLabel="Waktu" name="waktu" form="filter-seluler" value={minutesValue} options={minutesOptions} />
                    </div>
                    <div class="flex flex-col gap-1.5">
                      <span class={labelClass}>Kesulitan</span>
                      <Select variant="field" ariaLabel="Kesulitan" name="kesulitan" form="filter-seluler" value={state.difficulty ?? ''} options={difficultyOptions} />
                    </div>
                    <noscript>
                      <Button type="submit" form="filter-seluler" variant="outline" class="w-full">Terapkan</Button>
                    </noscript>
                  </div>
                </details>
                <Select label="Waktu" name="waktu" value={minutesValue} options={minutesOptions} class="hidden lg:block" />
                <Select label="Kesulitan" name="kesulitan" value={state.difficulty ?? ''} options={difficultyOptions} class="hidden lg:block" />
                {/* Only one ordering exists (best match first); a real select keeps it honest. */}
                <Select label="Urutkan" name="urut" value="cocok" align="end" options={[{ value: 'cocok', label: 'Paling cocok' }]} class="flex-1 lg:flex-none" />
                <noscript>
                  <Button type="submit" variant="outline" class="hidden lg:inline-flex">Terapkan</Button>
                </noscript>
              </form>
            </div>

            {selected.length === 0 ? (
              <Empty
                icon="refrigerator"
                title="Dapurmu masih kosong"
                description="Tambahkan beberapa bahan yang kamu punya, lalu kami carikan resep yang paling cocok."
              />
            ) : matches.length === 0 ? (
              <Empty
                title="Belum ada resep yang cocok"
                description="Coba tambahkan bahan lain atau longgarkan filter waktu dan kesulitan."
                action={
                  <ButtonLink href={href({ maxMinutes: null, difficulty: null })} variant="outline">
                    Hapus filter
                  </ButtonLink>
                }
              />
            ) : (
              <ol data-reveal-group>
                {visible.map((match, index) => (
                  <PantryResult
                    key={match.recipe.id}
                    match={match}
                    rank={index + 1}
                    shell={shell}
                    saved={savedRecipeIds.includes(match.recipe.id)}
                    returnTo={shell.path}
                  />
                ))}
              </ol>
            )}

            {hidden > 0 && (
              <div class="flex justify-center border-t border-line pt-6 lg:pt-8">
                <ButtonLink
                  href={href({ showAll: true })}
                  variant="outline"
                  size="lg"
                  class="h-12 w-full lg:h-[46px] lg:w-auto lg:border-surface-dark lg:bg-surface-dark lg:px-6 lg:text-white lg:hover:bg-ink"
                >
                  <Icon name="chevron-down" />
                  Tampilkan {hidden} resep lainnya
                </ButtonLink>
              </div>
            )}
          </section>
        </div>
      </SiteLayout>
    )
  }
}

function PantryResult(
  handle: Handle<{
    match: PantryMatch<PantryRecipe>
    rank: number
    shell: Shell
    saved: boolean
    returnTo: string
  }>,
) {
  return () => {
    let { match, rank, shell, saved, returnTo } = handle.props
    let recipe = match.recipe
    let recipeHref = routes.recipes.show.href({ id: recipe.id })
    // The best match is a dark card on desktop (the design); mobile keeps the plain list row.
    let featured = rank === 1
    let badge =
      featured
        ? { icon: 'sparkles' as const, label: 'Paling cocok' }
        : match.missing.length === 1
          ? { icon: 'circle-check' as const, label: 'Tinggal 1 bahan' }
          : null
    let muted = featured ? 'text-muted lg:text-line-strong' : 'text-muted'
    let strong = featured ? 'lg:text-white' : undefined

    return (
      <li
        class={cn(
          'grid grid-cols-[84px_minmax(0,1fr)] gap-x-3.5 gap-y-4 border-t border-line py-6 lg:grid-cols-[28px_240px_minmax(0,1fr)_minmax(0,440px)] lg:gap-8 lg:py-10',
          featured && 'lg:rounded-lg lg:border-t-0 lg:bg-surface-dark lg:p-10',
          rank === 2 && 'lg:border-t-0',
        )}
      >
        <span class={cn('hidden text-sm font-medium lg:block', muted)}>{String(rank).padStart(2, '0')}</span>
        <a href={recipeHref} class="aspect-square overflow-hidden rounded-md bg-hover lg:aspect-[240/172] lg:rounded-lg" tabIndex={-1} aria-hidden="true">
          {recipe.imageUrl && <img src={recipe.imageUrl} alt="" class="size-full object-cover" loading="lazy" />}
        </a>
        <div class="flex min-w-0 flex-col gap-1.5 self-center lg:justify-between lg:gap-2 lg:self-stretch">
          <div class="flex flex-col gap-1.5 lg:gap-2">
            <div class={cn('flex-wrap items-center gap-2', badge ? 'flex' : 'hidden lg:flex')}>
              <span class={cn('hidden text-xs lg:inline', muted)}>{formatCategories(recipe.categories)}</span>
              {badge && (
                <span class="inline-flex items-center gap-1 rounded-sm bg-accent-subtle px-1.5 py-0.5 text-[11px] font-medium tracking-[0.01em] text-accent-strong lg:rounded-full lg:px-2.5 lg:py-1 lg:text-xs lg:tracking-normal">
                  <Icon name={badge.icon} size={12} class="size-[11px] lg:size-3" />
                  {badge.label}
                </span>
              )}
            </div>
            <h3 class={cn('text-[17px] font-medium lg:text-[32px] lg:leading-[35px] lg:font-normal lg:tracking-[-0.32px]', strong)}>
              <a href={recipeHref} class="hover:underline">
                <span class="lg:hidden">{rank}. </span>
                {recipe.title}
              </a>
            </h3>
            <p class="text-[13px] tracking-[0.02em] text-muted lg:hidden">
              {formatMinutes(recipe.totalMinutes)} · {difficultyLabel(recipe.difficulty)}
            </p>
            <div class="hidden flex-wrap gap-x-3.5 gap-y-1 lg:flex">
              <MetaItem icon="clock-3" class={muted}>{formatMinutes(recipe.totalMinutes)}</MetaItem>
              <MetaItem icon="signal" class={muted}>{difficultyLabel(recipe.difficulty)}</MetaItem>
              <MetaItem icon="user-round" class={muted}>{recipe.authorName}</MetaItem>
            </div>
          </div>
          <div class="hidden gap-2 lg:flex">
            <ButtonLink href={recipeHref} variant={featured ? 'default' : 'dark'} size="lg" class="lg:px-6">
              Lihat Resep
              <Icon name="arrow-right" />
            </ButtonLink>
            {shell.viewer && (
              <form method="post" action={routes.recipes.save.href({ id: recipe.id })}>
                <CsrfField token={shell.csrfToken} />
                <input type="hidden" name="simpan" value={saved ? '0' : '1'} />
                <input type="hidden" name="kembali" value={returnTo} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="lg"
                  class={cn(featured && 'text-white hover:bg-surface-dark-line', saved && (featured ? 'text-peach' : 'text-accent-strong'))}
                  aria-pressed={saved ? 'true' : 'false'}
                >
                  <Icon name="bookmark" />
                  {saved ? 'Tersimpan' : 'Simpan'}
                </Button>
              </form>
            )}
          </div>
        </div>

        <div class="col-span-2 flex flex-col gap-4 lg:col-span-1 lg:gap-3.5">
          <p class="flex items-baseline justify-between gap-3">
            <span class={cn('text-sm font-medium tracking-[0.01em] lg:text-[15px] lg:tracking-normal', strong)}>
              Bahan cocok: {match.matchedCount} dari {match.requiredCount}
            </span>
            <span class={cn('text-[13px] tracking-[0.02em] lg:font-medium lg:tracking-normal', muted)}>{match.percent}%</span>
          </p>
          <div class="flex origin-left gap-[3px]" data-grow role="img" aria-label={`${match.matchedCount} dari ${match.requiredCount} bahan tersedia`}>
            {[...match.have, ...match.missing].map((ingredient, index) => (
              <span
                key={ingredient.id}
                class={cn(
                  'h-[5px] flex-1 rounded-full lg:h-1.5',
                  index < match.have.length ? 'bg-accent' : cn('bg-line', featured && 'lg:bg-white/20'),
                )}
              />
            ))}
          </div>
          <dl class="flex flex-col gap-2.5 text-[13px] leading-[19px] lg:pt-1">
            <MatchLine icon="circle-check" iconClass="text-accent" label="Punya" featured={featured}>
              {match.have.length > 0 ? match.have.map((item) => item.name).join(', ') : '–'}
            </MatchLine>
            {match.missing.length > 0 && (
              <MatchLine
                icon="circle-dashed"
                iconClass={muted}
                label="Kurang"
                labelLg={`Kurang ${match.missing.length}`}
                valueClass="font-medium"
                featured={featured}
              >
                {match.missing.map((item) => item.name).join(', ')}
              </MatchLine>
            )}
            {match.substitutions.length > 0 && (
              <MatchLine
                icon="arrow-left-right"
                iconClass={cn('text-warning', featured && 'lg:text-sand')}
                label="Ganti"
                labelLg="Pengganti"
                valueClass={cn('font-medium text-warning', featured && 'lg:text-sand')}
                featured={featured}
              >
                {match.substitutions.slice(0, 3).map((s, index) => (
                  // Mobile shows only the first substitution, as in the design.
                  <span key={`${s.missing.id}-${s.substitute.id}`} class={index > 0 ? 'hidden lg:inline' : undefined}>
                    {index > 0 && ' · '}
                    {`${s.missing.name} → ${s.substitute.name}${s.inPantry ? ' (kamu punya)' : ''}`}
                  </span>
                ))}
              </MatchLine>
            )}
          </dl>
        </div>
      </li>
    )
  }
}

function MatchLine(
  handle: Handle<{
    icon: 'circle-check' | 'circle-dashed' | 'arrow-left-right'
    iconClass: string
    /** Mobile label; `labelLg` replaces it on desktop. */
    label: string
    labelLg?: string
    valueClass?: string
    /** Sits on the dark "best match" card on desktop. */
    featured?: boolean
    children?: RemixNode
  }>,
) {
  return () => {
    let { icon, iconClass, label, labelLg, valueClass, featured, children } = handle.props
    return (
      <div class="flex gap-2 tracking-[0.02em] lg:gap-2.5 lg:tracking-normal">
        <dt class={cn('flex w-[75px] shrink-0 items-start gap-2 text-muted lg:w-[98px] lg:gap-2.5', featured && 'lg:text-line-strong')}>
          <Icon name={icon} size={16} class={cn('size-[15px] lg:size-4', iconClass)} />
          {labelLg ? (
            <>
              <span class="lg:hidden">{label}</span>
              <span class="hidden lg:inline">{labelLg}</span>
            </>
          ) : (
            label
          )}
        </dt>
        <dd class={cn('min-w-0 text-ink', featured && 'lg:text-white', valueClass)}>{children}</dd>
      </div>
    )
  }
}
