// Infinite scroll for <LoadMore> (app/ui/load-more.tsx): when the "Muat lebih banyak" link
// nears the viewport, or is clicked, fetch the next page's fragment and append its items to
// the list. Without JavaScript the link stays a normal link to the next page.
import { initPageMotion } from './motion.ts'

const started = new WeakSet<HTMLAnchorElement>()

export function initLoadMore() {
  for (let link of document.querySelectorAll<HTMLAnchorElement>('a[data-load-more]')) {
    if (started.has(link)) continue
    started.add(link)
    setUp(link)
  }
}

function setUp(link: HTMLAnchorElement) {
  let container = link.closest('[data-slot="load-more"]')
  let count = container?.querySelector('[data-load-more-count]')
  let list = document.getElementById(link.getAttribute('aria-controls') ?? '')
  if (!list) return

  let loading = false
  let observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void load()
    },
    // Start loading a little before the button scrolls into view.
    { rootMargin: '0px 0px 600px 0px' },
  )
  observer.observe(link)

  link.addEventListener('click', (event) => {
    // After a failed load the link is a plain link again.
    if (!link.dataset.loadMore) return
    event.preventDefault()
    void load()
  })

  async function load() {
    let fragment = link.dataset.loadMore
    if (loading || !fragment || !list) return
    loading = true
    link.setAttribute('aria-busy', 'true')
    link.textContent = 'Memuat…'
    try {
      let response = await fetch(fragment, { headers: { Accept: 'text/html' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      let template = document.createElement('template')
      template.innerHTML = await response.text()
      let chunk = template.content.querySelector<HTMLElement>('[data-load-more-chunk]')
      if (!chunk) throw new Error('Missing load-more chunk')

      list.append(...chunk.children)
      if (count && chunk.dataset.count) count.textContent = chunk.dataset.count
      // Reveal the new cards like the ones rendered with the page.
      initPageMotion()

      if (chunk.dataset.next) {
        link.dataset.loadMore = chunk.dataset.next
        if (chunk.dataset.nextHref) link.href = chunk.dataset.nextHref
        link.textContent = 'Muat lebih banyak'
        link.removeAttribute('aria-busy')
        loading = false
        // Still in view (short page or fast scroll): keep filling.
        observer.unobserve(link)
        observer.observe(link)
      } else {
        observer.disconnect()
        link.remove()
      }
    } catch (error) {
      // Fall back to the plain link (a full page that includes the next page).
      console.error(error)
      observer.disconnect()
      link.textContent = 'Muat lebih banyak'
      link.removeAttribute('aria-busy')
      delete link.dataset.loadMore
    }
  }
}
