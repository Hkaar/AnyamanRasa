// shadcn/ui Tabs as navigation links: each tab is a URL, so it works without
// JavaScript (pen.dev Tabs/Item: ink when active, cream when inactive, pink on hover).
import { cn } from './utils.ts'

export const tabsListClass = 'flex gap-2'

export function tabsTriggerClass(active: boolean, extra?: string): string {
  return cn(
    'flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm tracking-[0.02em] transition-colors',
    active ? 'bg-ink text-white' : 'bg-hover text-muted hover:bg-pink hover:text-ink',
    extra,
  )
}
