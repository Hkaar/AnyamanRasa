// shadcn/ui Skeleton (pen.dev 02b loading state: $bg-hover blocks).
import type { Handle } from 'remix/component'

import { cn } from './utils.ts'

export function Skeleton(handle: Handle<{ class?: string }>) {
  return () => <div data-slot="skeleton" aria-hidden="true" class={cn('rounded-xs bg-hover motion-safe:animate-pulse', handle.props.class)} />
}
