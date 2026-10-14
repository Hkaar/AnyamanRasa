// shadcn/ui Tooltip, themed with pen.dev's Tooltip (lJvuL). CSS-only: the tip
// shows while its trigger is hovered or keyboard-focused, so it needs no JavaScript.
import type { Handle, RemixNode } from 'remix/component'

import { cn } from './utils.ts'

export const tooltipContentClass =
  'pointer-events-none absolute z-40 rounded-sm bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100 group-has-[:focus-visible]/tooltip:opacity-100'

const SIDES = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  right: 'top-1/2 left-full ml-2 -translate-y-1/2',
  left: 'top-1/2 right-full mr-2 -translate-y-1/2',
} as const

/**
 * Wraps a trigger and shows `content` beside it. The trigger keeps its own
 * accessible name; the tip is presentational (`aria-hidden`).
 */
export function Tooltip(
  handle: Handle<{ content: string; side?: keyof typeof SIDES; class?: string; children?: RemixNode }>,
) {
  return () => {
    let { content, side = 'top', class: className, children } = handle.props
    return (
      <span data-slot="tooltip" class={cn('group/tooltip relative inline-flex', className)}>
        {children}
        <span aria-hidden="true" class={cn(tooltipContentClass, SIDES[side])}>
          {content}
        </span>
      </span>
    )
  }
}
