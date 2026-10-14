import { clientEntry, on } from 'remix/component'
import type { Handle } from 'remix/component'

import { Icon } from '../../../ui/icon.tsx'

/** Shares the page with the Web Share API, falling back to copying the link. */
export const ShareButton = clientEntry(
  import.meta.url,
  function ShareButton(handle: Handle<{ title: string }>) {
    let copied = false
    return () => (
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-md text-ink hover:bg-hover"
        aria-label={copied ? 'Tautan tersalin' : 'Bagikan resep'}
        mix={on('click', async () => {
          let url = window.location.href
          if (navigator.share) {
            await navigator.share({ title: handle.props.title, url }).catch(() => {})
            return
          }
          await navigator.clipboard.writeText(url).catch(() => {})
          copied = true
          await handle.update()
          setTimeout(() => {
            copied = false
            handle.update()
          }, 2000)
        })}
      >
        <Icon name={copied ? 'check' : 'share-2'} size={18} />
      </button>
    )
  },
)
