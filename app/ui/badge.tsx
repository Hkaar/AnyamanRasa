// shadcn/ui Badge, themed with pen.dev's Tag, Chip/Ingredient and Chip/Selected.
import type { Handle, Props } from 'remix/component'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from './utils.ts'

export const badgeVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 border tracking-[0.02em] whitespace-nowrap transition-[color,background-color,border-color] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** pen.dev Tag: counts, labels, popular searches. */
        default: 'rounded-full border-outline px-3 py-1 text-xs text-ink',
        /** pen.dev Chip/Ingredient. */
        chip: 'h-[34px] rounded-full border-outline bg-bg pr-3 pl-4 text-sm text-ink',
        /** Quick-add / inactive filter chip. */
        'chip-muted': 'h-[34px] rounded-full border-line bg-subtle pr-3 pl-4 text-sm text-muted',
        /** pen.dev Chip/Selected. */
        selected: 'h-[34px] rounded-full border-surface-dark bg-surface-dark pr-4 pl-3 text-sm text-white',
        /** Status pills and small highlights. */
        accent: 'rounded-full border-transparent bg-accent-subtle px-2.5 py-[2px] text-xs leading-4 text-accent-strong',
        info: 'rounded-full border-transparent bg-warning-subtle px-2 py-[2px] text-xs leading-4 text-warning',
        muted: 'rounded-full border-transparent bg-hover px-2 py-[2px] text-xs leading-4 text-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export type BadgeVariantProps = VariantProps<typeof badgeVariants>

export function Badge(handle: Handle<Props<'span'> & BadgeVariantProps>) {
  return () => {
    let { variant, class: className, ...props } = handle.props
    return <span data-slot="badge" class={cn(badgeVariants({ variant }), className as string)} {...props} />
  }
}
