// shadcn/ui Separator.
import type { Handle } from 'remix/component'

import { cn } from './utils.ts'

export function Separator(
  handle: Handle<{ orientation?: 'horizontal' | 'vertical'; decorative?: boolean; class?: string }>,
) {
  return () => {
    let { orientation = 'horizontal', decorative = true } = handle.props
    return (
      <div
        data-slot="separator"
        role={decorative ? 'none' : 'separator'}
        aria-orientation={decorative ? undefined : orientation}
        class={cn('shrink-0 bg-line', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', handle.props.class)}
      />
    )
  }
}
