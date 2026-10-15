// Loading feedback for client-side navigations (Remix swaps the page in place through the
// Navigation API, so the browser shows no loading indicator of its own). A thin accent bar
// creeps across the top while the server responds, and the current page dims if it takes a
// while. Neither shows for fast navigations, so quick pages do not flicker. A page that only
// changes its own filters (same path, `[data-results]` section) shows placeholder cards instead
// of dimming (pen.dev 02c).
import { type AnimationPlaybackControls, animate } from 'motion'

import { prefersReducedMotion } from './motion.ts'

const SHOW_BAR_AFTER = 150
const DIM_AFTER = 450
const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]

let bar: HTMLElement | null = null
let barAnimation: AnimationPlaybackControls | null = null
let timers: ReturnType<typeof setTimeout>[] = []
let shown = false
let dimmed: HTMLElement | null = null
let results: { section: HTMLElement; count: HTMLElement | null; text: string } | null = null

/** The bar lives outside the rendered page; re-attach it if something removed it. */
function barElement(): HTMLElement {
  if (!bar) {
    bar = document.createElement('div')
    bar.setAttribute('aria-hidden', 'true')
    bar.className = 'pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] origin-left bg-accent opacity-0'
    bar.style.transform = 'scaleX(0)'
  }
  // Outside <body>, which the page swap re-renders.
  if (!bar.isConnected) document.documentElement.append(bar)
  return bar
}

function duration(seconds: number) {
  return prefersReducedMotion() ? 0 : seconds
}

function start(destination: URL) {
  clearTimers()
  document.querySelector('main')?.setAttribute('aria-busy', 'true')
  let section = destination.pathname === location.pathname ? document.querySelector<HTMLElement>('[data-results]') : null
  timers.push(
    setTimeout(() => {
      let element = barElement()
      shown = true
      barAnimation?.stop()
      element.style.opacity = '1'
      // Quick to about half, then a slow creep: it never claims to be done before it is.
      barAnimation = animate(element, { transform: ['scaleX(0)', 'scaleX(0.92)'] }, { duration: duration(10), ease: [0.08, 0.82, 0.17, 1] })
    }, SHOW_BAR_AFTER),
    setTimeout(() => {
      if (!section) return
      let count = document.querySelector<HTMLElement>('[data-results-count]')
      results = { section, count, text: count?.textContent ?? '' }
      section.setAttribute('data-loading', '')
      if (count) count.textContent = 'Memuat resep…'
    }, SHOW_BAR_AFTER),
    setTimeout(() => {
      if (section) return
      dimmed = document.querySelector('main')
      if (dimmed) animate(dimmed, { opacity: 0.55 }, { duration: duration(0.3), ease: 'easeOut' })
    }, DIM_AFTER),
  )
}

function finish(failed: boolean) {
  clearTimers()
  document.querySelector('main')?.removeAttribute('aria-busy')
  // After a success the page entrance (motion.ts) fades the new content in; restore it otherwise.
  if (dimmed && (failed || prefersReducedMotion())) animate(dimmed, { opacity: 1 }, { duration: duration(0.2) })
  dimmed = null
  // After a success the new page replaced the section; restore the old one otherwise.
  if (results && failed) {
    results.section.removeAttribute('data-loading')
    if (results.count) results.count.textContent = results.text
  }
  results = null
  if (!shown || !bar) return
  shown = false
  let element = bar
  barAnimation?.stop()
  barAnimation = animate(element, { transform: 'scaleX(1)' }, { duration: duration(0.3), ease: EXPO })
  barAnimation.finished.then(async () => {
    if (shown) return // a newer navigation took the bar over
    await animate(element, { opacity: 0 }, { duration: duration(0.3), ease: 'easeOut' }).finished
    if (!shown) element.style.transform = 'scaleX(0)'
  })
}

function clearTimers() {
  for (let timer of timers) clearTimeout(timer)
  timers = []
}

interface NavigateEventLike extends Event {
  destination: { url: string }
  canIntercept: boolean
  hashChange: boolean
  downloadRequest: string | null
}

export function startNavigationProgress() {
  if (!('navigation' in window)) return
  let navigation = window.navigation as EventTarget
  navigation.addEventListener('navigate', (event) => {
    let navigate = event as NavigateEventLike
    if (!navigate.canIntercept || navigate.hashChange || navigate.downloadRequest !== null) return
    start(new URL(navigate.destination.url))
  })
  navigation.addEventListener('navigatesuccess', () => finish(false))
  navigation.addEventListener('navigateerror', () => finish(true))
}
