// shadcn/ui Tabs as navigation links: each tab is a URL, so it works without
// JavaScript (pen.dev Tabs: pills, the active tab filled with ink).
import { cn } from './utils.ts'

export const tabsListClass = 'flex gap-2'

export function tabsTriggerClass(active: boolean, extra?: string): string {
  return cn(
    'flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm tracking-[0.02em] transition-colors',
    active ? 'border-surface-dark bg-surface-dark text-white' : 'border-ink/80 text-ink hover:bg-hover',
    extra,
  )
}
