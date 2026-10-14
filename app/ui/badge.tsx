// shadcn/ui Badge, themed with pen.dev's Tag, Chip/Ingredient and Chip/Selected
// (tinted fills, no borders; hover states apply where the badge is interactive).
import type { Handle, Props } from 'remix/component'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from './utils.ts'

export const badgeVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 tracking-[0.02em] whitespace-nowrap transition-[color,background-color,box-shadow] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** pen.dev Tag: counts, labels, popular searches. */
        default: 'rounded-full bg-hover px-3 py-1 text-xs text-ink [a&]:hover:bg-hover-strong',
        /** pen.dev Chip/Ingredient. */
        chip: 'h-[34px] rounded-full bg-hover pr-3 pl-4 text-sm text-ink [a&,button&,label&]:hover:bg-hover-strong [a&,button&,label&]:active:bg-pressed',
        /** Quick-add / inactive filter chip. */
        'chip-muted': 'h-[34px] rounded-full bg-subtle pr-3 pl-4 text-sm text-muted',
        /** pen.dev Chip/Selected. */
        selected:
          'h-[34px] rounded-full bg-ink pr-4 pl-3 text-sm text-white [a&,button&,label&]:hover:bg-surface-dark [a&,button&,label&]:active:bg-night',
        /** Status pills and small highlights. */
        accent: 'rounded-full bg-accent-subtle px-2.5 py-[2px] text-xs leading-4 text-accent-strong',
        info: 'rounded-full bg-warning-subtle px-2 py-[2px] text-xs leading-4 text-warning',
        muted: 'rounded-full bg-hover px-2 py-[2px] text-xs leading-4 text-muted',
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
