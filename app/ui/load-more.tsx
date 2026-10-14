// "Muat lebih banyak" with infinite scroll as progressive enhancement.
// Without JavaScript it is a plain link to the next (cumulative) page. With JavaScript,
// entry.ts loads the next page as a fragment (`fragmentHref`, rendered by
// <LoadMoreChunk>) when the button nears the viewport or is clicked, and appends its
// items to the list named by `listId`.
import type { Handle, RemixNode } from 'remix/component'

import { buttonVariants } from './button.tsx'
import { cn } from './utils.ts'

export interface LoadMoreProps {
  /** id of the element the new items are appended to. */
  listId: string
  shown: number
  total: number
  /** Count line, e.g. `Menampilkan 20 dari 48 resep`. */
  countLabel: (shown: number) => string
  /** Full page with every item up to the next page (the no-JavaScript fallback). */
  href: string
  /** The next page's items only, rendered with <LoadMoreChunk>. */
  fragmentHref: string
  /** Button style: `dark` (Jelajahi Resep) or `outline` (profile). */
  variant?: 'dark' | 'outline'
  class?: string
}

export function LoadMore(handle: Handle<LoadMoreProps>) {
  return () => {
    let { listId, shown, total, countLabel, href, fragmentHref, variant = 'dark' } = handle.props
    return (
      <div data-slot="load-more" class={cn('flex flex-col items-center gap-3 pt-2', handle.props.class)}>
        <p class="text-[13px] text-muted" aria-live="polite" data-load-more-count>
          {countLabel(shown)}
        </p>
        {shown < total && (
          <a
            href={href}
            class={cn(
              buttonVariants({ variant }),
              'h-auto px-6 py-3.5 text-[15px] aria-busy:opacity-70',
              variant === 'outline' && 'w-full lg:w-auto',
            )}
            aria-controls={listId}
            data-load-more={fragmentHref}
            data-preserve-scroll
          >
            Muat lebih banyak
          </a>
        )}
      </div>
    )
  }
}

/**
 * Fragment response for the next page: its children are the new list items. `next` is
 * the following page's fragment URL and `nextHref` its full-page fallback (both omitted
 * on the last page); `countLabel` is the updated count line.
 */
export function LoadMoreChunk(
  handle: Handle<{ next?: string; nextHref?: string; countLabel: string; children?: RemixNode }>,
) {
  return () => (
    <div
      data-load-more-chunk
      data-next={handle.props.next}
      data-next-href={handle.props.nextHref}
      data-count={handle.props.countLabel}
    >
      {handle.props.children}
    </div>
  )
}
