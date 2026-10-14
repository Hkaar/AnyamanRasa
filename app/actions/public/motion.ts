// Page motion (Motion, https://motion.dev), applied as progressive enhancement
// to server-rendered markup. Content is always visible without JavaScript;
// motion only adds entrances for content below the fold and small feedback.
// Hooks are data attributes so styling stays in Tailwind classes:
//   data-reveal          fade + rise when scrolled into view
//   data-reveal-group    stagger its direct children into view
//   data-grow            bar that fills from the left (add Tailwind `origin-left`)
//   data-toast           toast entrance and timed dismissal
//   details[data-pop]    animate the panel after <summary> when opened
import { animate, inView, press, stagger } from 'motion'

const EASE_OUT: [number, number, number, number] = [0.2, 0, 0, 1]

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

function revealOnScroll(root: ParentNode) {
  for (let element of root.querySelectorAll<HTMLElement>('[data-reveal]')) {
    if (!belowFold(element)) continue
    element.style.opacity = '0'
    inView(
      element,
      () => {
        reveal([element], () => animate(element, { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, ease: EASE_OUT }))
      },
      { amount: 0.2 },
    )
  }

  for (let group of root.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    let items = [...group.children].filter((child): child is HTMLElement => child instanceof HTMLElement)
    let pending = items.filter(belowFold)
    if (pending.length === 0) continue
    for (let item of pending) item.style.opacity = '0'
    inView(
      group,
      () => {
        reveal(pending, () =>
          animate(pending, { opacity: [0, 1], y: [20, 0] }, { duration: 0.45, ease: EASE_OUT, delay: stagger(0.06) }),
        )
      },
      { amount: 0.1, margin: '0px 0px -8% 0px' },
    )
  }
}

function growBars(root: ParentNode) {
  let bars = [...root.querySelectorAll<HTMLElement>('[data-grow]')]
  for (let bar of bars) {
    inView(
      bar,
      () => {
        animate(bar, { scaleX: [0, 1] }, { duration: 0.7, ease: EASE_OUT, delay: Number(bar.dataset.grow) || 0 })
      },
      { amount: 0.6 },
    )
  }
}

function pressFeedback() {
  press('[data-slot="button"]:not(:disabled), [data-slot="badge"], [data-slot="toggle-group-item"]', (element) => {
    animate(element, { scale: 0.97 }, { duration: 0.12, ease: 'easeOut' })
    return () => animate(element, { scale: 1 }, { type: 'spring', stiffness: 500, damping: 28 })
  })
}

function toasts(root: ParentNode) {
  for (let toast of root.querySelectorAll<HTMLElement>('[data-toast]')) {
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

export function startPageMotion() {
  if (prefersReducedMotion()) return
  revealOnScroll(document)
  growBars(document)
  pressFeedback()
  toasts(document)
  disclosurePanels()
}
