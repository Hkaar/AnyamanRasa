import {
  detectMultipleImportMapSupport,
  importModule,
  preloadShim,
} from 'remix/multiple-import-maps-polyfill'
import { run } from 'remix/component'

import { initLoadMore } from './load-more.ts'
import { initPageMotion, startPageMotion } from './motion.ts'
import { startNavigationProgress } from './progress.ts'

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

// Select (app/ui/select.tsx): show the chosen option in the trigger and close the panel.
document.addEventListener('change', (event) => {
  let input = event.target
  if (!(input instanceof HTMLInputElement) || input.type !== 'radio') return
  let select = input.closest<HTMLDetailsElement>('details[data-select]')
  if (!select) return
  let label = input.closest('label')?.querySelector('[data-select-label]')?.textContent
  let value = select.querySelector('[data-select-value]')
  if (value && label) value.textContent = label
  select.open = false
  select.querySelector('summary')?.focus()
})

// Dropdowns (`details[data-pop]`) close on a click outside them or on Escape.
document.addEventListener('click', (event) => {
  for (let details of document.querySelectorAll<HTMLDetailsElement>('details[data-pop][open]')) {
    if (!details.contains(event.target as Node)) details.open = false
  }
})
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  let open = (event.target as Element | null)?.closest<HTMLDetailsElement>('details[data-pop][open]')
  if (!open) return
  open.open = false
  open.querySelector('summary')?.focus()
})

// Scroller buttons: `data-scroll-by="±1"` scrolls the element named by `aria-controls` by about one
// card. Past either end it wraps around, so the carousel loops endlessly.
document.addEventListener('click', (event) => {
  let button = (event.target as Element | null)?.closest<HTMLElement>('[data-scroll-by]')
  let list = button && document.getElementById(button.getAttribute('aria-controls') ?? '')
  if (!button || !list) return
  let direction = Number(button.dataset.scrollBy)
  let end = list.scrollWidth - list.clientWidth
  let edge = 4
  if (direction > 0 && list.scrollLeft >= end - edge) {
    list.scrollTo({ left: 0, behavior: 'smooth' })
  } else if (direction < 0 && list.scrollLeft <= edge) {
    list.scrollTo({ left: end, behavior: 'smooth' })
  } else {
    let step = (list.firstElementChild?.getBoundingClientRect().width ?? list.clientWidth) + 20
    list.scrollBy({ left: direction * step, behavior: 'smooth' })
  }
})

// Home header (`data-blend`): blends into the hero only while the page is scrolled to the top.
// Looked up on every call, because client-side navigation can swap the header.
function syncBlendingHeader() {
  document.querySelector('header[data-blend]')?.toggleAttribute('data-at-top', window.scrollY <= 8)
}
window.addEventListener('scroll', syncBlendingHeader, { passive: true })

// Settings form (profile/pages.tsx): live character counts, the chosen photo's file name, and
// the save bar's count of unsaved changes.
document.addEventListener('input', (event) => {
  let field = event.target
  if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return
  let counter = field.dataset.charCount && document.getElementById(field.dataset.charCount)
  if (counter) counter.textContent = `${field.value.length} / ${field.maxLength}`
  if (field.form?.hasAttribute('data-track-changes')) syncChanges(field.form)
})
document.addEventListener('change', (event) => {
  let field = event.target
  if (!(field instanceof HTMLInputElement) || !field.form?.hasAttribute('data-track-changes')) return
  let name = document.querySelector(`[data-file-name-for="${field.id}"]`)
  if (name && field.type === 'file' && field.files?.[0]) name.textContent = field.files[0].name
  syncChanges(field.form)
})

function syncChanges(form: HTMLFormElement) {
  let changed = 0
  for (let element of form.elements) {
    if (element instanceof HTMLTextAreaElement) changed += Number(element.value !== element.defaultValue)
    if (!(element instanceof HTMLInputElement) || element.type === 'hidden') continue
    if (element.type === 'file') changed += Number((element.files?.length ?? 0) > 0)
    else if (element.type === 'checkbox') changed += Number(element.checked !== element.defaultChecked)
    else changed += Number(element.value !== element.defaultValue)
  }
  let label = document.querySelector(`[data-changes-label="${form.id}"]`)
  if (label) label.textContent = changed > 0 ? `Ada ${changed} perubahan yang belum disimpan` : 'Belum ada perubahan'
  label?.closest('[data-changes-bar]')?.toggleAttribute('data-dirty', changed > 0)
}

// Offline banner (layout.tsx, pen.dev 12c): follows the browser's connection state. "Sambungkan
// lagi" reloads once the connection is back; until then it only re-checks.
function syncOfflineBanner() {
  let banner = document.querySelector<HTMLElement>('[data-offline-banner]')
  if (banner) banner.hidden = navigator.onLine
}
window.addEventListener('online', syncOfflineBanner)
window.addEventListener('offline', syncOfflineBanner)
document.addEventListener('click', (event) => {
  if (!(event.target as Element | null)?.closest('[data-offline-retry]')) return
  if (navigator.onLine) location.reload()
  else syncOfflineBanner()
})

// Simulated payment (subscription/page.tsx, pen.dev 14c): `data-countdown` ticks down from its
// seconds as mm:ss, and `data-auto-advance` moves on to its URL after `data-advance-after` seconds.
let paymentTimer: ReturnType<typeof setInterval> | undefined
function initPaymentWait() {
  clearInterval(paymentTimer)
  let advance = document.querySelector<HTMLElement>('[data-auto-advance]')
  let countdown = document.querySelector<HTMLElement>('[data-countdown]')
  if (!advance && !countdown) return
  let started = Date.now()
  paymentTimer = setInterval(() => {
    let elapsed = Math.floor((Date.now() - started) / 1000)
    if (countdown?.isConnected) {
      let left = Math.max(0, Number(countdown.dataset.countdown) - elapsed)
      countdown.textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`
    }
    if (!advance?.isConnected) return clearInterval(paymentTimer)
    if (elapsed >= Number(advance.dataset.advanceAfter)) {
      clearInterval(paymentTimer)
      location.assign(advance.dataset.autoAdvance!)
    }
  }, 1000)
}

// Per-page setup: on the first load, and after each client-side navigation (Remix swaps the
// page in place through the Navigation API, so no new document or `load` event happens).
function initPage() {
  syncBlendingHeader()
  syncOfflineBanner()
  initPageMotion()
  initLoadMore()
  initPaymentWait()
}

startPageMotion()
startNavigationProgress()
initPage()
if ('navigation' in window) {
  ;(window.navigation as EventTarget).addEventListener('navigatesuccess', initPage)
}
