// shadcn/ui Button, ported to Remix components and themed with the pen.dev tokens
// (Button/Primary → default (terracotta), Button/Secondary → outline (cream fill, no border),
// Button/Ghost, Button/Accent → dark (brown); `accent` is the soft terracotta tint).
// Hover/pressed/focus/disabled follow the design's Button/*/{Hover,Pressed,Focus,Disabled}.
import type { Handle, Props } from 'remix/component'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from './utils.ts'

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-sm text-sm tracking-[0.02em] whitespace-nowrap outline-none transition-[color,background-color,box-shadow,opacity] focus-visible:ring-[3px] focus-visible:ring-focus-ring disabled:pointer-events-none aria-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          'bg-accent text-white hover:bg-accent-strong active:bg-accent-pressed disabled:bg-hover disabled:text-faint aria-disabled:bg-hover aria-disabled:text-faint',
        outline:
          'bg-hover text-ink hover:bg-hover-strong active:bg-pressed disabled:bg-subtle disabled:text-faint aria-disabled:bg-subtle aria-disabled:text-faint',
        dark: 'bg-surface-dark text-white hover:bg-ink active:bg-night disabled:bg-hover disabled:text-faint aria-disabled:bg-hover aria-disabled:text-faint',
        ghost: 'text-ink hover:bg-hover active:bg-hover-strong disabled:text-faint aria-disabled:text-faint',
        accent: 'bg-accent-subtle text-accent-strong hover:bg-accent/15 disabled:opacity-40 aria-disabled:opacity-40',
        destructive:
          'bg-error text-white hover:bg-error/90 focus-visible:ring-error/25 disabled:opacity-40 aria-disabled:opacity-40',
        link: 'text-ink underline-offset-4 hover:underline disabled:opacity-40 aria-disabled:opacity-40',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 gap-1.5 px-3 text-[13px]',
        lg: 'h-11 px-4 text-[15px] lg:h-[46px] lg:px-5',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>

export function Button(handle: Handle<Props<'button'> & ButtonVariantProps>) {
  return () => {
    let { variant, size, class: className, type = 'button', ...props } = handle.props
    return (
      <button
        data-slot="button"
        type={type}
        class={cn(buttonVariants({ variant, size }), className as string)}
        {...props}
      />
    )
  }
}

/** shadcn's `<Button asChild><a/></Button>`: a link styled as a button. */
export function ButtonLink(handle: Handle<Props<'a'> & ButtonVariantProps>) {
  return () => {
    let { variant, size, class: className, ...props } = handle.props
    return <a data-slot="button" class={cn(buttonVariants({ variant, size }), className as string)} {...props} />
  }
}
