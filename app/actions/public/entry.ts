import {
  detectMultipleImportMapSupport,
  importModule,
  preloadShim,
} from 'remix/multiple-import-maps-polyfill'
import { run } from 'remix/component'

import { startPageMotion } from './motion.ts'

const app = run({
  async loadModule(moduleUrl, exportName) {
    let mod = await importModule(moduleUrl)
    let Component = mod[exportName]
    if (typeof Component !== 'function') {
      throw new Error(`Unknown component: ${moduleUrl}#${exportName}`)
    }
    return Component
  },
  async processClientEntryPreloads(preloads) {
    if (await detectMultipleImportMapSupport()) return preloads

    preloadShim(preloads)
    return []
  },
})

app.addEventListener('error', (event) => {
  console.error('Component error:', (event as ErrorEvent).error)
})

if (import.meta.hot) {
  import.meta.hot.on('server:update', async () => {
    try {
      await app.ready()
      await app.frames.top.reload()
    } catch (error) {
      console.error('Error reloading top frame on server update', error)
    }
  })
}

// Filter forms marked `data-autosubmit` apply as soon as a control changes.
document.addEventListener('change', (event) => {
  let target = event.target
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return
  if (target.type === 'search' || target.type === 'text') return
  let form = target.form
  if (form?.hasAttribute('data-autosubmit')) form.requestSubmit()
})

// Scroller buttons: `data-scroll-by="±1"` scrolls the element named by `aria-controls` by about one card.
document.addEventListener('click', (event) => {
  let button = (event.target as Element | null)?.closest<HTMLElement>('[data-scroll-by]')
  let list = button && document.getElementById(button.getAttribute('aria-controls') ?? '')
  if (!button || !list) return
  let step = (list.firstElementChild?.getBoundingClientRect().width ?? list.clientWidth) + 20
  list.scrollBy({ left: Number(button.dataset.scrollBy) * step, behavior: 'smooth' })
})

startPageMotion()
