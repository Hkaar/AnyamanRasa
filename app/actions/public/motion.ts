// Page motion (Motion, https://motion.dev), applied as progressive enhancement
// to server-rendered markup. Content is always visible without JavaScript;
// motion only adds entrances for content below the fold and small feedback.
// Remix navigates client-side (the page is swapped in place), so entry.ts calls
// `initPageMotion` again after each navigation. Elements the diff keeps between
// renders are remembered in `seen`, so they are not hidden and animated twice.
// Hooks are data attributes so styling stays in Tailwind classes:
// The feel follows krepling.com: Lenis smooth scrolling, long easeOutExpo curves, headings
// that rise out of a mask with a slight skew and tilt, and images that settle from a zoom.
//   data-reveal          fade + rise when scrolled into view; its h1/h2 rise out of a mask
//   data-reveal-group    stagger its direct children into view
//   data-media           image (inside an overflow-hidden frame) that settles from a zoom
//                        when its reveal group brings it into view
//   data-grow            bar that fills from the left (add Tailwind `origin-left`)
//   data-toast           toast entrance and timed dismissal
//   details[data-pop]    animate the panel after <summary> when opened
//   [data-hero]          home hero: copy entrance ([data-hero-copy]) and artwork
//                        ([data-hero-art], [data-depth]) entrance, idle drift and parallax
import Lenis from 'lenis'
import { type AnimationPlaybackControls, animate, inView, press, stagger } from 'motion'

type Bezier = [number, number, number, number]

const EASE_OUT: Bezier = [0.2, 0, 0, 1]
/** easeOutExpo: a quick start and a long, soft settle (Krepling's entrance curve). */
const EXPO: Bezier = [0.16, 1, 0.3, 1]
/** easeInOutQuad, for opacity alongside an EXPO movement. */
const FADE: Bezier = [0.45, 0, 0.55, 1]

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** True when the element starts below the visible viewport (safe to hide and reveal). */
function belowFold(element: Element): boolean {
  return element.getBoundingClientRect().top > window.innerHeight * 0.92
}

/**
 * Runs an entrance for elements that were hidden for it. If the animation
 * cannot start, the elements are shown immediately: content never stays hidden.
 */
function reveal(elements: HTMLElement[], run: () => unknown) {
  try {
    run()
  } catch (error) {
    for (let element of elements) element.style.opacity = ''
    console.error(error)
  }
}

/** Elements already set up by an earlier `initPageMotion` run (kept by the DOM diff). */
const seen = new WeakSet<Element>()

function firstTime(element: Element): boolean {
  if (seen.has(element)) return false
  seen.add(element)
  return true
}

/**
 * Heading entrance: the text rises out of its own line box, slightly skewed and tilted, as if
 * from behind a mask. The clip moves with the element, so clipping it from the bottom by the
 * distance it is still lowered shows exactly the part a static mask would. The clip extends
 * past the box so descenders and the skew are not cut off.
 */
function riseFromMask(element: HTMLElement, delay = 0) {
  element.style.transformOrigin = '0% 0%'
  let animation = animate(
    element,
    {
      opacity: [0, 1],
      transform: [
        'perspective(1200px) translateY(100%) skewY(-5deg) rotateY(-10deg)',
        'perspective(1200px) translateY(0%) skewY(0deg) rotateY(0deg)',
      ],
      clipPath: ['inset(-25% -15% 100% -15%)', 'inset(-25% -15% -25% -15%)'],
    },
    { duration: 1.25, ease: EXPO, delay, opacity: { duration: 0.6, ease: FADE } },
  )
  // Motion commits the end styles after `finished` resolves, so clear them a frame later.
  animation.finished.then(() =>
    requestAnimationFrame(() => {
      element.style.transform = ''
      element.style.clipPath = ''
      element.style.transformOrigin = ''
    }),
  )
  return animation
}

/**
 * Image entrance: it settles from a slight zoom inside its frame. A full transform string keeps
 * this on the compositor (WAAPI), so it does not trip the hover `transition-transform`.
 */
function settleMedia(media: HTMLElement, delay = 0) {
  animate(media, { transform: ['scale(1.12)', 'scale(1)'] }, { duration: 2.25, ease: EXPO, delay }).finished.then(() =>
    requestAnimationFrame(() => {
      media.style.transform = ''
    }),
  )
}

function revealOnScroll(root: ParentNode) {
  for (let element of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (!firstTime(element) || !belowFold(element)) continue
    element.style.opacity = '0'
    inView(
      element,
      () => {
        reveal([element], () => {
          animate(element, { opacity: [0, 1], y: [40, 0] }, { duration: 1, ease: EXPO, opacity: { duration: 0.6, ease: FADE } })
          element.querySelectorAll<HTMLElement>('h1, h2').forEach((heading, index) => riseFromMask(heading, 0.05 + index * 0.075))
        })
      },
      { amount: 0.2 },
    )
  }

  for (let group of root.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    let items = [...group.children].filter((child): child is HTMLElement => child instanceof HTMLElement && firstTime(child))
    let pending = items.filter(belowFold)
    if (pending.length === 0) continue
    for (let item of pending) item.style.opacity = '0'
    inView(
      group,
      () => {
        reveal(pending, () => {
          animate(pending, { opacity: [0, 1], y: [32, 0] }, { duration: 1, ease: EXPO, delay: stagger(0.075), opacity: { duration: 0.6, ease: FADE } })
          pending.forEach((item, index) => {
            for (let media of item.querySelectorAll<HTMLElement>('[data-media]')) settleMedia(media, index * 0.075)
          })
        })
      },
      { amount: 0.1, margin: '0px 0px -8% 0px' },
    )
  }
}

function growBars(root: ParentNode) {
  let bars = [...root.querySelectorAll<HTMLElement>('[data-grow]')].filter(firstTime)
  for (let bar of bars) {
    inView(
      bar,
      () => {
        animate(bar, { scaleX: [0, 1] }, { duration: 1.2, ease: EXPO, delay: Number(bar.dataset.grow) || 0 })
      },
      { amount: 0.6 },
    )
  }
}

function pressFeedback(): () => void {
  return press('[data-slot="button"]:not(:disabled), [data-slot="badge"], [data-slot="toggle-group-item"]', (element) => {
    animate(element, { scale: 0.97 }, { duration: 0.12, ease: 'easeOut' })
    return () => animate(element, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 28 })
  })
}

function toasts(root: ParentNode) {
  for (let toast of root.querySelectorAll<HTMLElement>('[data-toast]')) {
    if (!firstTime(toast)) continue
    animate(toast, { opacity: [0, 1], y: [24, 0] }, { duration: 0.4, ease: EASE_OUT })
    // Dismiss after a pause; hovering or focusing the toast keeps it open.
    let timer: ReturnType<typeof setTimeout>
    let schedule = () => {
      timer = setTimeout(async () => {
        await animate(toast, { opacity: 0, y: 12 }, { duration: 0.25, ease: 'easeIn' })
        toast.remove()
      }, 6000)
    }
    toast.addEventListener('pointerenter', () => clearTimeout(timer))
    toast.addEventListener('focusin', () => clearTimeout(timer))
    toast.addEventListener('pointerleave', schedule)
    schedule()
  }
}

function disclosurePanels() {
  document.addEventListener(
    'toggle',
    (event) => {
      let details = event.target
      if (!(details instanceof HTMLDetailsElement) || !details.open || !details.hasAttribute('data-pop')) return
      let panel = details.querySelector(':scope > summary + *')
      if (panel) animate(panel, { opacity: [0, 1], y: [-6, 0] }, { duration: 0.2, ease: EASE_OUT })
    },
    true,
  )
}

/** Animates a freshly inserted element (dialogs, panels) unless motion is reduced. */
export function enter(element: Element, from: { y?: number; scale?: number } = { y: 8 }) {
  if (prefersReducedMotion()) return
  animate(
    element,
    { opacity: [0, 1], ...(from.y !== undefined ? { y: [from.y, 0] } : {}), ...(from.scale ? { scale: [from.scale, 1] } : {}) },
    { duration: 0.25, ease: EASE_OUT },
  )
}

// Critically damped: pieces land softly, without overshoot.
const SPRING = { type: 'spring', stiffness: 120, damping: 22 } as const

/** The running hero, so its endless animations stop once it leaves the page. */
let activeHero: { element: HTMLElement; controls: AnimationPlaybackControls[]; stop: () => void } | null = null

/** Home hero: staggered copy, artwork that settles in, then idle drift and parallax. */
function heroMotion(root: ParentNode) {
  if (activeHero && !activeHero.element.isConnected) {
    activeHero.stop()
    activeHero = null
  }
  let hero = root.querySelector<HTMLElement>('[data-hero]')
  // Already animating (a same-page navigation kept the element): leave it running.
  if (!hero || !firstTime(hero)) return
  let controls: AnimationPlaybackControls[] = []
  let track = (animation: AnimationPlaybackControls) => (controls.push(animation), animation)
  let copy = [...hero.querySelectorAll<HTMLElement>('[data-hero-copy]')].filter((element) => element.offsetParent !== null)
  // Headline lines rise out of a mask one after another; the rest of the copy follows them.
  let lines = copy.filter((element) => element.closest('h1'))
  let rest = copy.filter((element) => !lines.includes(element))
  lines.forEach((line, index) => track(riseFromMask(line, 0.15 + index * 0.1)))
  track(
    animate(
      rest,
      { opacity: [0, 1], y: [32, 0] },
      { duration: 1.1, ease: EXPO, delay: stagger(0.075, { startDelay: 0.45 }), opacity: { duration: 0.6, ease: FADE } },
    ),
  )
  // The inline script in the hero hid these until now; the entrance has taken over.
  let release = () => hero.removeAttribute('data-hero-pending')

  // The artwork only shows on large screens.
  if (!window.matchMedia('(min-width: 64rem)').matches) return release()
  let art = (role: string) => [...hero.querySelectorAll<HTMLElement>(`[data-hero-art="${role}"]`)]

  for (let tray of art('tray')) {
    track(animate(tray, { opacity: [0, 1], scale: [0.9, 1], rotate: [-14, 0] }, { duration: 1.4, ease: EXPO })).finished.then(
      // A woven tray turning very slowly under the bowl.
      () => track(animate(tray, { rotate: 360 }, { duration: 240, ease: 'linear', repeat: Infinity })),
    )
  }
  for (let bowl of art('bowl')) {
    track(animate(bowl, { opacity: [0, 1], scale: [0.82, 1], y: [-36, 0] }, { ...SPRING, delay: 0.3 })).finished.then(() =>
      track(animate(bowl, { y: [0, -6, 0] }, { duration: 6, ease: 'easeInOut', repeat: Infinity })),
    )
  }
  for (let leaf of art('leaf')) {
    track(animate(leaf, { opacity: [0, 1], x: [-90, 0] }, { duration: 1.6, ease: EXPO, delay: 0.15 }))
  }
  for (let text of art('text')) {
    track(animate(text, { opacity: [0, 1], y: [16, 0] }, { duration: 1.1, ease: EXPO, delay: 0.7 }))
  }
  art('item').forEach((item, index) => {
    track(animate(item, { opacity: [0, 1], scale: [0.4, 1], y: [-30, 0] }, { ...SPRING, delay: 0.45 + index * 0.08 })).finished.then(() =>
      // Ingredients drift on their own rhythm so the scene never moves in lockstep.
      track(
        animate(
          item,
          { y: [0, -12, 0], rotate: [0, index % 2 ? -5 : 5, 0] },
          { duration: 4.5 + index * 0.6, ease: 'easeInOut', repeat: Infinity, delay: index * 0.25 },
        ),
      ),
    )
  })

  release()

  // Parallax: pieces shift with the pointer and scroll by their data-depth. It uses the CSS
  // `translate` property, so it composes with the Motion transforms above.
  let layers = [...hero.querySelectorAll<HTMLElement>('[data-depth]')].map((element) => ({
    element,
    depth: Number(element.dataset.depth) || 0,
  }))
  let target = { x: 0, y: 0 }
  let current = { x: 0, y: 0 }
  let frame = 0
  let render = () => {
    current.x += (target.x - current.x) * 0.08
    current.y += (target.y - current.y) * 0.08
    let scrolled = Math.min(window.scrollY, hero.offsetHeight)
    for (let { element, depth } of layers) {
      element.style.translate = `${(-current.x * 36 * depth).toFixed(2)}px ${(-current.y * 24 * depth + scrolled * depth * 0.25).toFixed(2)}px`
    }
    let settling = Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001
    frame = settling ? requestAnimationFrame(render) : 0
  }
  let schedule = () => {
    if (!frame) frame = requestAnimationFrame(render)
  }
  hero.addEventListener('pointermove', (event) => {
    let bounds = hero.getBoundingClientRect()
    target.x = (event.clientX - bounds.left) / bounds.width - 0.5
    target.y = (event.clientY - bounds.top) / bounds.height - 0.5
    schedule()
  })
  hero.addEventListener('pointerleave', () => {
    target.x = 0
    target.y = 0
    schedule()
  })
  let listeners = new AbortController()
  window.addEventListener('scroll', schedule, { passive: true, signal: listeners.signal })
  activeHero = {
    element: hero,
    controls,
    stop() {
      listeners.abort()
      cancelAnimationFrame(frame)
      for (let animation of controls) animation.stop()
    },
  }
}

let lenis: Lenis | null = null

/**
 * Smooth (interpolated) wheel scrolling, as on krepling.com. Touch keeps native scrolling.
 * Scrollable panels scroll on their own (allowNestedScroll); dialogs and the graph canvas,
 * which zooms on the wheel, opt out.
 */
function smoothScroll() {
  lenis = new Lenis({
    lerp: 0.1,
    autoRaf: true,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
    prevent: (node) => node instanceof HTMLDialogElement,
  })
}

/** After a client-side navigation: drop leftover scroll inertia and fade the new page in. */
function pageEntrance() {
  lenis?.stop()
  lenis?.start()
  lenis?.resize()
  let main = document.querySelector<HTMLElement>('main')
  if (main) animate(main, { opacity: [0, 1], y: [12, 0] }, { duration: 0.7, ease: EXPO, opacity: { duration: 0.4, ease: FADE } })
}

/** Once per document: listeners that work for every page through event delegation. */
export function startPageMotion() {
  if (prefersReducedMotion()) return
  smoothScroll()
  disclosurePanels()
  if ('navigation' in window) (window.navigation as EventTarget).addEventListener('navigatesuccess', pageEntrance)
}

let stopPress: (() => void) | null = null

/** Per page: runs on the first load and again after every client-side navigation. */
export function initPageMotion() {
  if (prefersReducedMotion()) return
  heroMotion(document)
  revealOnScroll(document)
  growBars(document)
  toasts(document)
  // `press` binds to the elements matching now, so rebind it for the new page.
  stopPress?.()
  stopPress = pressFeedback()
}
