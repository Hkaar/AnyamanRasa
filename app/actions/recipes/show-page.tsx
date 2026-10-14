import type { Handle } from 'remix/component'

import { difficultyLabel, formatCategories, formatDate, formatMinutes, RELATION_LABELS } from '../../domain/format.ts'
import { type IngredientChange, ingredientChangesOnly } from '../../domain/lineage.ts'
import type { ExplicitRelation, RecipeDetail, RecipeSummary } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { Icon, type IconName } from '../../ui/icon.tsx'
import { SiteLayout, loginHref } from '../../ui/layout.tsx'
import { CsrfField, MetaItem } from '../../ui/primitives.tsx'
import { RecipeCard } from '../../ui/recipe-card.tsx'
import type { Shell } from '../../ui/shell.ts'
import { IngredientPanel } from './public/ingredient-panel.tsx'
import { ShareButton } from './public/share-button.tsx'
import { ButtonLink, buttonVariants } from '../../ui/button.tsx'
import { tabsListClass, tabsTriggerClass } from '../../ui/tabs.tsx'
import { cn, eyebrow, pageX } from '../../ui/utils.ts'
import { Avatar } from '../../ui/avatar.tsx'
import { Breadcrumb } from '../../ui/breadcrumb.tsx'

export interface VariationWithChanges {
  recipe: RecipeSummary
  changes: IngredientChange[]
}

export interface RecipeShowPageProps {
  shell: Shell
  recipe: RecipeDetail
  isOwner: boolean
  isSaved: boolean
  variations: VariationWithChanges[]
  /** When this recipe is itself a variation: its changes against the source. */
  ownChanges: IngredientChange[] | null
  relations: ExplicitRelation[]
  related: RecipeSummary[]
}

export function RecipeShowPage(handle: Handle<RecipeShowPageProps>) {
  return () => {
    let { shell, recipe, isOwner, isSaved, variations, ownChanges, relations, related } = handle.props
    let graphHref = `${routes.graph.index.href()}?simpul=recipe:${recipe.id}`
    let variationHref = routes.recipes.variation.index.href({ id: recipe.id })
    let pantryHref = `${routes.pantry.index.href()}?${recipe.ingredients.map((i) => `bahan=${i.ingredientId}`).join('&')}`
    let stepMinutes = recipe.steps.reduce((sum, step) => sum + (step.minutes ?? 0), 0)
    let mainCategory = recipe.categories[0]

    return (
      <SiteLayout shell={shell} active="recipes" title={recipe.title} description={recipe.description}>
        {recipe.status !== 'published' && (
          <div class="border-b border-line bg-warning-subtle">
            <p class={cn(pageX, 'flex items-center gap-2 py-3 text-[13px] text-warning')}>
              <Icon name="info" />
              {recipe.status === 'draft'
                ? 'Ini draf. Hanya kamu yang bisa melihatnya sampai diterbitkan.'
                : 'Resep ini diarsipkan dan tidak tampil di pencarian maupun Graf Resep.'}
            </p>
          </div>
        )}

        {/* Mobile back bar */}
        <div class={cn(pageX, 'flex min-h-[46px] items-center justify-between lg:hidden')}>
          <a href={routes.recipes.index.href()} class="flex min-h-[46px] items-center gap-2 text-[13px] text-muted">
            <Icon name="arrow-left" />
            Jelajahi Resep
          </a>
          <div class="flex items-center">
            <ShareButton title={recipe.title} />
            <SaveForm shell={shell} recipeId={recipe.id} saved={isSaved} variant="mobile" />
          </div>
        </div>
        <div class="aspect-[390/300] bg-hover lg:hidden">
          {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} class="size-full object-cover" />}
        </div>

        <header class={cn(pageX, 'flex flex-col gap-4 pt-7 pb-2 lg:gap-10 lg:pt-10 lg:pb-14')}>
          <Breadcrumb
            class="hidden lg:block"
            items={[
              { label: 'Beranda', href: routes.home.href() },
              { label: 'Jelajahi Resep', href: routes.recipes.index.href() },
              ...(mainCategory ? [{ label: mainCategory, href: `${routes.recipes.index.href()}?q=${encodeURIComponent(mainCategory)}` }] : []),
              { label: recipe.title },
            ]}
          />
          <p class="text-xs font-medium tracking-[0.01em] text-muted lg:hidden">{formatCategories(recipe.categories)}</p>
          {recipe.parent && (
            <a
              href={routes.recipes.show.href({ id: recipe.parent.id })}
              class="-mb-1 flex items-center gap-1.5 self-start text-[13px] font-medium text-accent-strong hover:underline lg:-mt-4 lg:-mb-4"
            >
              <Icon name="git-branch" size={14} class="text-accent" />
              Variasi dari {recipe.parent.title} · {recipe.parent.authorName}
            </a>
          )}
          <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-12">
            <div class="flex min-w-0 flex-col gap-4 lg:gap-6">
              <h1 class="text-[36px] leading-[40px] font-normal tracking-[-0.01em] lg:text-[88px] lg:leading-[92px]">
                {recipe.title}
              </h1>
              <p class="max-w-[640px] text-[15px] leading-[23px] tracking-[0.02em] text-muted lg:text-lg lg:leading-[27px]">{recipe.description}</p>
            </div>
            <div class="hidden shrink-0 items-center gap-2 lg:flex">
              <SaveForm shell={shell} recipeId={recipe.id} saved={isSaved} variant="desktop" />
              {isOwner && (
                <ButtonLink href={routes.recipes.edit.index.href({ id: recipe.id })} variant="outline" size="lg" class="h-[47px] px-6">
                  <Icon name="pencil" />
                  Ubah
                </ButtonLink>
              )}
              <ButtonLink href={graphHref} variant="dark" size="lg" class="h-[47px] px-6">
                <Icon name="waypoints" />
                Lihat Hubungan Resep
              </ButtonLink>
              {recipe.status === 'published' && (
                <ButtonLink href={variationHref} variant="default" size="lg" class="h-[47px] px-6">
                  <Icon name="git-branch" />
                  Buat Variasi
                </ButtonLink>
              )}
            </div>
          </div>

          {/* Author + meta */}
          <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:border-y lg:border-line lg:py-6">
            <a href={routes.profile.show.href({ username: recipe.author.username })} class="flex items-center gap-3">
              <Avatar name={recipe.author.name} src={recipe.author.avatarUrl} size={40} class="max-lg:size-8!" />
              <span class="flex flex-col gap-px lg:gap-0.5">
                <span class="text-[13px] font-medium lg:text-sm">{recipe.author.name}</span>
                <span class="text-xs text-muted lg:text-[13px]">
                  <span class="hidden lg:inline">Diterbitkan </span>
                  {formatDate(recipe.createdAt)} · {recipe.variationCount} variasi
                </span>
              </span>
            </a>
            <dl class="grid grid-cols-2 overflow-hidden rounded-lg border border-line max-lg:mt-4 lg:flex lg:rounded-none lg:border-0">
              <MetaCell icon="clock-3" label="Durasi" value={formatMinutes(recipe.totalMinutes)} />
              <MetaCell icon="signal" label="Kesulitan" value={difficultyLabel(recipe.difficulty)} />
              <MetaCell icon="users-round" label="Porsi" value={`${recipe.servings} porsi`} />
              <MetaCell
                icon="tag"
                label="Kategori"
                value={formatCategories(recipe.categories)}
                mobileValue={mainCategory ?? '–'}
              />
            </dl>
          </div>

          {recipe.changeSummary && (
            <div class="flex gap-3.5 rounded-lg bg-accent-subtle p-5 text-sm leading-[1.55] text-accent-strong">
              <Icon name="git-compare-arrows" size={18} />
              <div class="flex flex-col gap-2">
                <p class="font-semibold">Apa yang diubah dari resep asli</p>
                <p>{recipe.changeSummary}</p>
                {ownChanges && <ChangeChips changes={ingredientChangesOnly(ownChanges)} />}
              </div>
            </div>
          )}

          <div class="flex flex-col gap-2 pt-1 lg:hidden">
            {recipe.status === 'published' && (
              <ButtonLink href={variationHref} variant="default" size="lg" class="min-h-[45px]">
                <Icon name="git-branch" />
                Buat Variasi
              </ButtonLink>
            )}
            <ButtonLink href={graphHref} variant="outline" size="lg" class="min-h-[45px]">
              <Icon name="waypoints" />
              Lihat Hubungan Resep
            </ButtonLink>
            {isOwner && (
              <ButtonLink href={routes.recipes.edit.index.href({ id: recipe.id })} variant="outline" size="lg" class="min-h-[45px]">
                <Icon name="pencil" />
                Ubah Resep
              </ButtonLink>
            )}
          </div>
        </header>

        <div class={cn(pageX, 'hidden lg:block')}>
          <div class="aspect-[2/1] overflow-hidden rounded-lg bg-hover">
            {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} class="size-full object-cover" fetchPriority="high" />}
          </div>
        </div>

        <nav aria-label="Bagian resep" class="sticky top-[60px] z-30 mt-6 border-b border-line bg-bg py-2.5 lg:hidden">
          <ul class={cn(pageX, tabsListClass)}>
            {[
              ['#bahan', 'Bahan'],
              ['#langkah', 'Langkah'],
              ['#variasi', 'Variasi'],
            ].map(([href, label], index) => (
              <li key={href}>
                <a href={href} class={tabsTriggerClass(index === 0, 'px-[18px]')}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div class={cn(pageX, 'grid gap-12 pt-7 pb-10 lg:grid-cols-[minmax(0,704px)_400px] lg:justify-between lg:gap-24 lg:pt-28 lg:pb-34')}>
          <div id="bahan" class="scroll-mt-28 lg:order-2">
            <IngredientPanel
              ingredients={recipe.ingredients}
              servings={recipe.servings}
              pantryHref={pantryHref}
              ingredientHrefBase="/bahan"
            />
          </div>

          <section id="langkah" aria-labelledby="langkah-title" class="scroll-mt-28 lg:order-1">
            <div class="flex flex-col gap-0.5 pb-4 lg:flex-row lg:items-end lg:justify-between lg:pb-8">
              <h2 id="langkah-title" class="text-[26px] leading-[30px] font-normal tracking-[-0.01em] lg:text-[60px] lg:leading-[66px]">
                Cara Memasak
              </h2>
              <p class="text-xs tracking-[0.02em] text-muted lg:text-[13px] lg:tracking-normal">
                {recipe.steps.length} langkah · ±{formatMinutes(stepMinutes || recipe.cookMinutes || recipe.totalMinutes)}
              </p>
            </div>
            <ol data-reveal-group>
              {recipe.steps.map((step, index) => (
                <li key={index} class="flex gap-4 border-t border-line py-[18px] last:border-b lg:gap-7 lg:py-8">
                  <span class="min-w-[18px] shrink-0 text-sm font-medium tracking-[0.2px] text-accent lg:text-[15px]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div class="flex flex-1 flex-col gap-1.5 lg:gap-2">
                    {(step.title || step.minutes) && (
                      <div class="flex items-center justify-between gap-4">
                        {step.title && (
                          <h3 class="text-base font-medium tracking-[0.01em] lg:text-2xl lg:font-normal lg:tracking-[-0.01em]">{step.title}</h3>
                        )}
                        {step.minutes ? (
                          <span class="hidden text-xs whitespace-nowrap text-faint lg:inline">{step.minutes} menit</span>
                        ) : null}
                      </div>
                    )}
                    <p class="text-sm leading-[22px] tracking-[0.02em] text-muted lg:text-base lg:leading-6">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <VariationsSection recipe={recipe} variations={variations} relations={relations} graphHref={graphHref} variationHref={variationHref} />

        {related.length > 0 && (
          <section aria-labelledby="terkait" class={cn(pageX, 'flex flex-col gap-5 pt-10 pb-12 lg:gap-14 lg:pt-32 lg:pb-34')}>
            <div class="flex items-center justify-between lg:items-end" data-reveal>
              <h2 id="terkait" class="text-[26px] leading-[30px] font-normal tracking-[-0.01em] lg:text-[60px] lg:leading-[66px]">
                Resep Terkait
              </h2>
              {mainCategory && (
                <ButtonLink href={`${routes.recipes.index.href()}?q=${encodeURIComponent(mainCategory)}`} variant="ghost" size="sm" class="font-medium max-lg:px-0 max-lg:text-muted max-lg:hover:bg-transparent lg:h-[47px] lg:px-5 lg:text-[15px] lg:font-normal">
                  Lihat semua
                </ButtonLink>
              )}
            </div>
            <div class="-mx-5 flex snap-x scroll-px-5 gap-3.5 md:scroll-px-0 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 lg:grid-cols-4" data-reveal-group>
              {related.map((item) => (
                <RecipeCard key={item.id} recipe={item} mobileCompact class="w-[220px] shrink-0 snap-start md:w-auto" />
              ))}
            </div>
          </section>
        )}
      </SiteLayout>
    )
  }
}

function SaveForm(
  handle: Handle<{ shell: Shell; recipeId: string; saved: boolean; variant: 'desktop' | 'mobile' }>,
) {
  return () => {
    let { shell, recipeId, saved, variant } = handle.props
    let buttonClass =
      variant === 'desktop'
        ? cn(buttonVariants({ variant: 'dark', size: 'icon' }), 'size-11 rounded-full', saved && 'text-peach')
        : cn('flex size-11 items-center justify-center rounded-md hover:bg-hover', saved && 'text-accent-strong')
    let icon = (
      <svg width={variant === 'desktop' ? 16 : 18} height={variant === 'desktop' ? 16 : 18} viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      </svg>
    )
    // Guests see the same bookmark; it leads to login and back here.
    if (!shell.viewer) {
      return (
        <a href={loginHref(shell.path)} class={buttonClass} aria-label="Masuk untuk menyimpan resep">
          {icon}
        </a>
      )
    }
    return (
      <form method="post" action={routes.recipes.save.href({ id: recipeId })}>
        <CsrfField token={shell.csrfToken} />
        <input type="hidden" name="simpan" value={saved ? '0' : '1'} />
        <button
          type="submit"
          aria-pressed={saved ? 'true' : 'false'}
          aria-label={saved ? 'Hapus dari simpanan' : 'Simpan resep'}
          class={buttonClass}
        >
          {icon}
        </button>
      </form>
    )
  }
}

function MetaCell(
  handle: Handle<{ icon: IconName; label: string; value: string; mobileValue?: string }>,
) {
  return () => {
    let { icon, label, value, mobileValue } = handle.props
    return (
      <div class="flex items-center gap-3 border-line px-4 py-3.5 max-lg:nth-[n+3]:border-t max-lg:even:border-l lg:border-l lg:px-7 lg:py-0 lg:first:border-l-0 lg:first:pl-0">
        <Icon name={icon} size={18} class="text-muted max-lg:size-4" />
        <div class="flex flex-col">
          <dt class="text-[11px] text-muted lg:text-xs">{label}</dt>
          <dd class="text-sm font-medium">
            {mobileValue ? (
              <>
                <span class="lg:hidden">{mobileValue}</span>
                <span class="hidden lg:inline">{value}</span>
              </>
            ) : (
              value
            )}
          </dd>
        </div>
      </div>
    )
  }
}

/**
 * `soft` = tinted chips (summary box, mobile feature card); `feature` switches to the
 * desktop feature card's dark/outlined chips from lg up.
 */
export function ChangeChips(
  handle: Handle<{ changes: IngredientChange[]; limit?: number; tone?: 'soft' | 'feature' }>,
) {
  return () => {
    let changes = handle.props.changes.slice(0, handle.props.limit ?? 8)
    if (changes.length === 0) return null
    return (
      <ul class="flex flex-wrap gap-1.5" aria-label="Perubahan bahan">
        {changes.map((change) => (
          <li
            key={`${change.kind}-${change.line.ingredientId}`}
            class={cn(
              'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium tracking-[0.01em]',
              change.kind === 'removed'
                ? 'border-line bg-subtle text-muted'
                : 'border-accent/20 bg-accent-subtle text-accent-strong',
              handle.props.tone === 'feature' &&
                (change.kind === 'removed'
                  ? 'lg:border-outline lg:bg-transparent lg:text-ink'
                  : 'lg:border-surface-dark lg:bg-surface-dark lg:text-white'),
              handle.props.tone === 'feature' && 'lg:px-3.5 lg:py-1.5 lg:text-[13px] lg:tracking-normal',
            )}
          >
            <span aria-hidden="true">
              {change.kind === 'added' ? '+' : change.kind === 'removed' ? '−' : '±'}
            </span>
            <span class="sr-only">
              {change.kind === 'added' ? 'Ditambah:' : change.kind === 'removed' ? 'Dihapus:' : 'Diubah:'}
            </span>
            {change.line.name}
          </li>
        ))}
      </ul>
    )
  }
}

const RELATION_ICONS: Record<string, IconName> = {
  similar_to: 'git-compare',
  inspired_by: 'lightbulb',
  pairs_with: 'arrow-left-right',
  variation_of: 'git-branch',
}

function VariationsSection(
  handle: Handle<{
    recipe: RecipeDetail
    variations: VariationWithChanges[]
    relations: ExplicitRelation[]
    graphHref: string
    variationHref: string
  }>,
) {
  return () => {
    let { recipe, variations, relations, graphHref, variationHref } = handle.props
    let [feature, ...otherVariations] = variations
    let rows: { href: string; name: string; meta: string; icon: IconName; imageUrl: string | null; label: string | null }[] = [
      ...relations.map((relation) => ({
        href:
          relation.other.type === 'recipe'
            ? routes.recipes.show.href({ id: relation.other.id })
            : routes.ingredients.show.href({ id: relation.other.id }),
        name: relation.other.name,
        meta: relationMeta(relation),
        icon: RELATION_ICONS[relation.type] ?? 'waypoints',
        imageUrl: relation.other.imageUrl,
        label: relation.label,
      })),
      ...otherVariations.map(({ recipe: variation }) => ({
        href: routes.recipes.show.href({ id: variation.id }),
        name: variation.title,
        meta: `Variasi · ${variation.author.name}`,
        icon: 'git-branch' as IconName,
        imageUrl: variation.imageUrl,
        label: null,
      })),
    ]

    return (
      <section id="variasi" aria-labelledby="variasi-title" class="scroll-mt-28 bg-surface-dark lg:bg-hover">
        <div class={cn(pageX, 'flex flex-col gap-5 py-10 lg:gap-14 lg:py-32')}>
          <div class="flex items-end justify-between">
            <h2
              id="variasi-title"
              class="text-[26px] leading-[30px] font-normal tracking-[-0.01em] text-white lg:text-[60px] lg:leading-[66px] lg:text-ink"
            >
              Variasi &amp; Hubungan
            </h2>
            <ButtonLink href={graphHref} variant="ghost" size="lg" class="hidden h-[47px] px-5 hover:bg-bg/60 lg:inline-flex">
              <Icon name="waypoints" />
              Lihat di graf resep
            </ButtonLink>
          </div>
          <div class="grid gap-5 lg:min-h-[420px] lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6" data-reveal-group>
            {feature ? (
              <article class="relative grid overflow-hidden rounded-lg bg-bg md:grid-cols-[340px_minmax(0,1fr)] lg:bg-linear-107 lg:from-peach/75 lg:from-9% lg:via-coral/75 lg:to-[#ebcfc0]/75 lg:to-91%">
                <div class="aspect-[350/180] bg-hover md:aspect-auto md:min-h-[372px] lg:min-h-[420px]">
                  {feature.recipe.imageUrl && <img src={feature.recipe.imageUrl} alt="" class="size-full object-cover" loading="lazy" />}
                </div>
                <div class="flex flex-col gap-2.5 p-[18px] lg:gap-4 lg:p-10">
                  <p class="flex items-center gap-1.5 text-xs font-medium tracking-[0.01em] text-accent-strong lg:gap-2 lg:tracking-normal lg:text-ink">
                    <Icon name="git-branch" size={14} class="text-accent max-lg:size-[13px] lg:text-ink" />
                    Variasi dari {recipe.title}
                  </p>
                  <h3 class="text-xl font-medium lg:text-[40px] lg:leading-[44px] lg:font-normal lg:tracking-[-0.01em]">
                    <a href={routes.recipes.show.href({ id: feature.recipe.id })} class="after:absolute after:inset-0">
                      {feature.recipe.title}
                    </a>
                  </h3>
                  <p class="hidden text-base leading-6 tracking-[0.02em] text-muted md:block lg:text-ink">{feature.recipe.description}</p>
                  {ingredientChangesOnly(feature.changes).length > 0 && (
                    <div class="flex flex-col gap-2 lg:py-1">
                      <p class={cn(eyebrow, 'font-medium max-md:hidden lg:text-ink')}>Perubahan bahan</p>
                      <ChangeChips changes={ingredientChangesOnly(feature.changes)} tone="feature" />
                    </div>
                  )}
                  <div class="flex flex-wrap gap-x-3.5 gap-y-1 pt-1 max-lg:[&_span]:text-xs max-lg:[&_svg]:size-[13px] lg:gap-x-4 lg:pt-2 lg:[&>span]:text-ink">
                    <MetaItem icon="user-round">{feature.recipe.author.name}</MetaItem>
                    <MetaItem icon="clock-3">{formatMinutes(feature.recipe.totalMinutes)}</MetaItem>
                    <MetaItem icon="signal">{difficultyLabel(feature.recipe.difficulty)}</MetaItem>
                  </div>
                </div>
              </article>
            ) : (
              <div class="flex flex-col items-start justify-center gap-3 rounded-lg border border-dashed border-line-strong bg-bg p-8">
                <Icon name="git-branch" size={20} class="text-accent" />
                <p class="text-lg tracking-[-0.01em]">Belum ada variasi</p>
                <p class="max-w-md text-sm leading-normal tracking-[0.02em] text-muted">
                  Jadilah yang pertama mengadaptasi resep ini. Variasimu akan tetap terhubung ke resep asli.
                </p>
              </div>
            )}

            <div class="flex flex-col gap-3 lg:gap-0 lg:overflow-hidden lg:rounded-lg lg:bg-bg">
              {rows.length > 0 ? (
                <ul class="flex flex-col gap-3 lg:gap-0">
                  {rows.map((row, index) => (
                    <li key={`${row.href}-${index}`} class="overflow-hidden rounded-lg bg-bg lg:rounded-none lg:border-line lg:not-first:border-t">
                      <a href={row.href} class="flex items-center gap-3 px-4 py-3.5 hover:bg-subtle lg:gap-3.5 lg:px-5 lg:py-4">
                        <span class="size-11 shrink-0 overflow-hidden rounded-md bg-hover lg:size-12">
                          {row.imageUrl ? (
                            <img src={row.imageUrl} alt="" class="size-full object-cover" loading="lazy" />
                          ) : (
                            <span class="flex size-full items-center justify-center text-accent">
                              <Icon name="leaf" />
                            </span>
                          )}
                        </span>
                        <span class="flex min-w-0 flex-1 flex-col gap-0.5 lg:gap-[3px]">
                          <span class="truncate text-sm font-medium">{row.name}</span>
                          <span class="text-xs tracking-[0.02em] text-muted lg:tracking-normal">{row.meta}</span>
                          {row.label && <span class="sr-only">{row.label}</span>}
                        </span>
                        <Icon name="chevron-right" class="text-faint lg:hidden" />
                        <Icon name={row.icon} class="text-faint max-lg:hidden" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p class="rounded-lg bg-bg p-5 text-sm leading-normal tracking-[0.02em] text-muted lg:rounded-none">
                  Belum ada hubungan eksplisit yang tercatat untuk resep ini.
                </p>
              )}
              <div class="mt-auto flex flex-col gap-3 border-t border-line p-5 max-lg:hidden">
                <p class="text-[13px] leading-5 text-muted">
                  Punya versi sendiri? Bagikan variasimu agar resep ini terus berkembang.
                </p>
                {recipe.status === 'published' && (
                  <ButtonLink href={variationHref} variant="default" size="lg" class="h-[47px] w-full">
                    <Icon name="git-branch" />
                    Buat Variasi
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
          <ButtonLink
            href={graphHref}
            variant="outline"
            size="lg"
            class="border-white bg-transparent text-white hover:bg-white/10 lg:hidden"
          >
            <Icon name="waypoints" />
            Lihat di graf resep
          </ButtonLink>
        </div>
      </section>
    )
  }
}

function relationMeta(relation: ExplicitRelation): string {
  let label = RELATION_LABELS[relation.type]
  if (relation.type === 'similar_to') return 'Resep serupa'
  if (relation.type === 'inspired_by')
    return relation.direction === 'outgoing' ? 'Sumber inspirasi' : 'Terinspirasi dari resep ini'
  if (relation.type === 'pairs_with') return 'Pasangan hidangan'
  return label
}
