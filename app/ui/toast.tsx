// shadcn/ui Sonner-style toast, rendered from a server flash (pen.dev Toast).
import type { Handle } from 'remix/component'

import { Icon } from './icon.tsx'

export function Toast(handle: Handle<{ message: string; action?: { label: string; href: string } }>) {
  return () => (
    <div
      data-slot="toast"
      data-toast
      role="status"
      class="fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-lg bg-ink px-4 py-3 text-sm text-white sm:left-auto"
    >
      <Icon name="circle-check" size={18} class="text-toast-icon" />
      <span class="flex-1">{handle.props.message}</span>
      {handle.props.action && (
        <a href={handle.props.action.href} class="font-medium underline-offset-4 hover:underline">
          {handle.props.action.label}
        </a>
      )}
    </div>
  )
}
