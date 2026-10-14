import type { Handle } from 'remix/component'

import { difficultyLabel, formatCategories, formatMinutes } from '../domain/format.ts'
import type { RecipeSummary } from '../domain/types.ts'
import { routes } from '../routes.ts'
import { Icon } from './icon.tsx'
import { MetaItem } from './primitives.tsx'
import { badgeVariants } from './badge.tsx'
import { cn } from './utils.ts'

export type RecipeCardSize = 'feature' | 'large' | 'default' | 'compact'

export interface RecipeCardProps {
  recipe: RecipeSummary
  size?: RecipeCardSize
  /** Hide the author (own profile). */
  hideAuthor?: boolean
  /** Below md: 15px title and only duration + difficulty (mobile scroller cards). */
  mobileCompact?: boolean
  /** Show "↳ Variasi dari …" instead of categories. */
  showLineage?: boolean
  /** Heading level for the title within the page outline. */
  headingLevel?: 2 | 3
  class?: string
}

const IMAGE_HEIGHT: Record<RecipeCardSize, string> = {
  feature: 'aspect-[588/400]',
  large: 'aspect-[350/240] md:aspect-[384/280]',
  default: 'aspect-[282/210]',
  compact: 'aspect-[168/150]',
}

const TITLE: Record<RecipeCardSize, string> = {
  feature: 'text-lg tracking-[-0.2px] md:text-[28px] md:leading-[1.1] md:tracking-[-0.3px]',
  large: 'text-lg leading-[1.1] tracking-[-0.2px] md:text-xl',
  default: 'text-lg leading-[1.2] tracking-[-0.2px]',
  compact: 'text-[15px] tracking-[-0.2px]',
}

export function RecipeCard(handle: Handle<RecipeCardProps>) {
  return () => {
    let { recipe, size = 'default', hideAuthor, showLineage, headingLevel = 3, mobileCompact } = handle.props
    let compact = size === 'compact'
    let lineage = showLineage && recipe.parent
    let titleLink = (
      <a
        href={routes.recipes.show.href({ id: recipe.id })}
        class="transition-colors after:absolute after:inset-0 after:rounded-lg group-hover:text-accent-strong focus-visible:outline-none group-has-[a:focus-visible]:underline"
      >
        {recipe.title}
      </a>
    )

    return (
      // Recipe Card/Hover: a cream panel grows around the card on pointer hover; the negative
      // margins cancel its padding so the grid does not shift. Cream sections set
      // --card-hover to white so the panel still shows.
      <article class={cn('group relative flex flex-col gap-3.5 rounded-lg transition-colors lg:-mx-2.5 lg:-mt-2.5 lg:-mb-4 lg:p-2.5 lg:pb-4 lg:hover:bg-(--card-hover,var(--color-hover))', (compact || mobileCompact) && 'max-md:gap-2.5', compact && 'gap-2.5', handle.props.class)}>
        <div class={cn('overflow-hidden rounded-md bg-hover', IMAGE_HEIGHT[size], mobileCompact && 'max-md:aspect-auto max-md:h-40')}>
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt=""
              loading="lazy"
              class="size-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
            />
          ) : (
            <div class="flex size-full items-center justify-center text-faint">
              <Icon name="image-plus" size={28} />
            </div>
          )}
        </div>
        <div class="flex flex-col gap-1.5">
          {!compact &&
            (lineage ? (
              <p class="text-xs font-medium text-accent-strong">
                ↳ Variasi dari {recipe.parent!.title} · {recipe.parent!.authorName}
              </p>
            ) : (
              <p class={cn('text-xs tracking-[0.02em] text-muted', mobileCompact && 'max-md:hidden')}>{formatCategories(recipe.categories)}</p>
            ))}
          {headingLevel === 2 ? (
            <h2 class={cn('font-medium text-ink', TITLE[size], mobileCompact && 'max-md:text-[15px]')}>{titleLink}</h2>
          ) : (
            <h3 class={cn('font-medium text-ink', TITLE[size], mobileCompact && 'max-md:text-[15px]')}>{titleLink}</h3>
          )}
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
            <MetaItem icon="clock-3">{formatMinutes(recipe.totalMinutes)}</MetaItem>
            {!compact && <MetaItem icon="signal">{difficultyLabel(recipe.difficulty)}</MetaItem>}
            {!compact && !hideAuthor && (
              <MetaItem icon="user-round" class={mobileCompact ? 'max-md:hidden' : undefined}>
                {recipe.author.name}
              </MetaItem>
            )}
            {recipe.status === 'draft' && <span class={badgeVariants()}>Draf</span>}
          </div>
        </div>
      </article>
    )
  }
}

/** Skeleton used while client-side results load (design 02b "Memuat hasil…"). */
export function RecipeCardSkeleton() {
  return () => (
    <div class="flex flex-col gap-3" aria-hidden="true">
      <div class="aspect-[282/210] animate-pulse rounded-md bg-hover" />
      <div class="h-2.5 w-[84px] rounded-xs bg-hover" />
      <div class="h-4 w-full rounded-xs bg-hover" />
      <div class="h-4 w-[120px] rounded-xs bg-hover" />
      <div class="flex gap-3">
        <div class="h-2.5 w-14 rounded-xs bg-hover" />
        <div class="h-2.5 w-12 rounded-xs bg-hover" />
        <div class="h-2.5 w-[72px] rounded-xs bg-hover" />
      </div>
    </div>
  )
}
