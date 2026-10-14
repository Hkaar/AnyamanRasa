// shadcn/ui Kbd.
import type { Handle, RemixNode } from 'remix/component'

import { cn } from './utils.ts'

export function Kbd(handle: Handle<{ class?: string; children?: RemixNode }>) {
  return () => (
    <kbd data-slot="kbd" class={cn('rounded-xs border border-line-strong px-1.5 py-px text-[11px] font-normal text-muted', handle.props.class)}>
      {handle.props.children}
    </kbd>
  )
}
