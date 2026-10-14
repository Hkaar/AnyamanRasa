// shadcn/ui Alert: inline form or page messages.
import type { Handle, RemixNode } from 'remix/component'
import { type VariantProps, cva } from 'class-variance-authority'

import { Icon, type IconName } from './icon.tsx'
import { cn } from './utils.ts'

export const alertVariants = cva('flex items-start gap-2.5 rounded-md px-3.5 py-3 text-[13px] leading-normal', {
  variants: {
    variant: {
      default: 'bg-subtle text-ink',
      destructive: 'bg-error-subtle text-error',
      success: 'bg-accent-subtle text-accent-strong',
      info: 'bg-warning-subtle text-warning',
    },
  },
  defaultVariants: { variant: 'default' },
})

const ICONS: Record<NonNullable<VariantProps<typeof alertVariants>['variant']>, IconName> = {
  default: 'info',
  destructive: 'circle-alert',
  success: 'circle-check',
  info: 'info',
}

export function Alert(
  handle: Handle<VariantProps<typeof alertVariants> & { class?: string; icon?: IconName; children?: RemixNode }>,
) {
  return () => {
    let { variant, icon, children } = handle.props
    let tone = variant ?? 'default'
    return (
      <div
        data-slot="alert"
        role={tone === 'destructive' ? 'alert' : 'status'}
        class={cn(alertVariants({ variant }), handle.props.class)}
      >
        <Icon name={icon ?? ICONS[tone]} class="mt-px" />
        <div class="flex flex-col gap-1">{children}</div>
      </div>
    )
  }
}
