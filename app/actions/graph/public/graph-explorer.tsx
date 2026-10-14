import { clientEntry, on } from 'remix/component'
import type { Handle, RemixNode } from 'remix/component'
import cytoscape, { type Core, type ElementDefinition, type StylesheetJson } from 'cytoscape'

import { difficultyLabel, formatMinutes } from '../../../domain/format.ts'
import {
  GRAPH_EDGE_KINDS,
  GRAPH_EDGE_LABELS,
  GRAPH_FILTER_LABELS,
  type GraphEdge,
  type GraphEdgeKind,
  type GraphNeighborhood,
  type GraphNode,
  MAX_GRAPH_DEPTH,
  type NodeKey,
} from '../../../domain/graph.ts'
import { routes } from '../../../routes.ts'
import { Icon } from '../../../ui/icon.tsx'
import { iconData } from '../../../ui/icon-data.ts'
import { MetaItem } from '../../../ui/primitives.tsx'
import { Tooltip } from '../../../ui/tooltip.tsx'
import { enter, prefersReducedMotion } from '../../public/motion.ts'
import { type GraphParams, type GraphView, graphQuery } from './params.ts'
import { Button, ButtonLink } from '../../../ui/button.tsx'
import { badgeVariants } from '../../../ui/badge.tsx'
import { cn } from '../../../ui/utils.ts'

export interface GraphExplorerProps {
  initial: GraphNeighborhood
  state: GraphParams
}

// Design tokens mirrored for the canvas renderer (Cytoscape draws to <canvas>, not CSS).
const COLOR = {
  ink: '#2A1F1A',
  muted: '#76655B',
  faint: '#A09186',
  line: '#ECE3DA',
  lineStrong: '#C9B8A8',
  bg: '#FFFFFF',
  subtle: '#FAF6F1',
  hover: '#F4ECE3',
  accent: '#D2693F',
  accentStrong: '#A8491F',
  accentSubtle: '#FBEDE5',
  warning: '#8A6A2E',
  warningSubtle: '#F8F0E1',
  surfaceDark: '#3E2F28',
}

const EDGE_COLORS: Record<GraphEdgeKind, string> = {
  similar_to: COLOR.faint,
  variation_of: COLOR.muted,
  uses: COLOR.lineStrong,
  substitute_for: COLOR.warning,
  pairs_with: COLOR.faint,
  inspired_by: COLOR.faint,
  same_category: COLOR.line,
}

const KIND_ICONS = {
  similar_to: 'git-compare-arrows',
  variation_of: 'git-branch',
  uses: 'leaf',
  substitute_for: 'arrow-left-right',
  pairs_with: 'arrow-left-right',
  inspired_by: 'lightbulb',
  same_category: 'tag',
} as const

/** Kinds the design's filter lists; others appear only when they have edges. */
const OPTIONAL_KINDS: readonly GraphEdgeKind[] = ['inspired_by']

function visibleKinds(graph: GraphNeighborhood): GraphEdgeKind[] {
  return GRAPH_EDGE_KINDS.filter(
    (kind) => !OPTIONAL_KINDS.includes(kind) || graph.kindCounts[kind] > 0,
  )
}

/** Ingredient node glyph (pen.dev node: 18px rounded dot with a 12px Lucide icon). */
function nodeDot(background: string, stroke: string, icon: 'leaf' | 'arrow-left-right'): string {
  let shapes = iconData[icon]
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
    .join('')
  let svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">` +
    `<rect width="18" height="18" rx="4" fill="${background}"/>` +
    `<g transform="translate(3 3) scale(0.5)" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${shapes}</g></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** Readable zoom floor after fitting: labels stay legible instead of shrinking the whole graph. */
function readableZoom(cy: Core): number {
  return cy.width() < 600 ? 0.8 : 0.9
}

/**
 * Interactive Recipe Graph (SKPL-F-03.x). Cytoscape renders the bounded
 * neighbourhood; the "Daftar" view lists the same nodes and relationships
 * as an accessible, non-graph alternative.
 */
export const GraphExplorer = clientEntry(
  import.meta.url,
  function GraphExplorer(handle: Handle<GraphExplorerProps>) {
    let graph = handle.props.initial
    let state: GraphParams = { ...handle.props.state, center: graph.center }
    let selected: NodeKey | null = null
    let loading = false
    let error: string | null = null
    let zoom = 1
    let filtersOpen = true
    let cy: Core | null = null
    let request: AbortController | null = null

    let searchQuery = ''
    let searchResults: { key: NodeKey; type: string; name: string }[] = []
    let searchController: AbortController | null = null
    let canvasId = `${handle.id}-canvas`
    let panelId = `${handle.id}-panel`

    function nodeByKey(key: NodeKey | null) {
      return key ? graph.nodes.find((node) => node.key === key) ?? null : null
    }

    function syncUrl(push: boolean) {
      let url = `${routes.graph.index.href()}?${graphQuery(state)}`
      if (push) history.pushState(null, '', url)
      else history.replaceState(null, '', url)
    }

    async function load(next: Partial<GraphParams>, push: boolean) {
      state = { ...state, ...next }
      request?.abort()
      request = new AbortController()
      loading = true
      error = null
      handle.update()
      try {
        let query = graphQuery({ ...state, view: 'graf' })
        let response = await fetch(`${routes.graph.data.href()}?${query}`, { signal: request.signal })
        if (!response.ok) throw new Error(String(response.status))
        graph = (await response.json()) as GraphNeighborhood
        if (selected && !nodeByKey(selected)) selected = null
        if (next.center) selected = null
        loading = false
        syncUrl(push)
        renderGraph(true)
        handle.update()
      } catch (cause) {
        if ((cause as Error).name === 'AbortError') return
        loading = false
        error = 'Graf gagal dimuat. Periksa koneksi lalu coba lagi.'
        handle.update()
      }
    }

    function setView(view: GraphView) {
      state = { ...state, view }
      syncUrl(false)
      handle.update().then(() => {
        if (view === 'graf') {
          cy?.resize()
          fitView()
        }
      })
    }

    function select(key: NodeKey | null) {
      let wasOpen = selected !== null
      selected = key
      cy?.nodes().removeClass('selected')
      cy?.edges().removeClass('highlight')
      if (key && cy) {
        let node = cy.getElementById(key)
        node.addClass('selected')
        node.connectedEdges().addClass('highlight')
      }
      let opening = key !== null && !wasOpen
      let closing = key === null && wasOpen
      let widthBefore = cy?.width() ?? 0
      // The desktop side panel changes the canvas width; the mobile sheet covers its bottom.
      handle.update().then(() => {
        if (!cy) return
        cy.resize()
        let panel = document.getElementById(panelId)
        if (opening && panel) enter(panel, { y: window.innerWidth < 1024 ? 32 : 0 })
        if (opening || closing) cy.panBy({ x: (cy.width() - widthBefore) / 2, y: 0 })
        if (key) revealNode(key)
      })
    }

    function elements(): ElementDefinition[] {
      let levels = distances(graph)
      let substitutes = new Set(
        graph.edges.filter((edge) => edge.kind === 'substitute_for').map((edge) => edge.target),
      )
      return [
        ...graph.nodes.map((node) => ({
          group: 'nodes' as const,
          data: {
            id: node.key,
            name: node.name,
            type: node.type,
            image: node.imageUrl ?? undefined,
            level: levels.get(node.key) ?? 3,
            labelWidth: Math.max(64, Math.round(node.name.length * 6.6) + 46),
          },
          classes: cn(
            node.key === graph.center && 'center',
            node.type === 'ingredient' && substitutes.has(node.key) && 'substitute',
            node.type === 'recipe' && !node.imageUrl && 'no-image',
          ),
        })),
        ...graph.edges.map((edge) => ({
          group: 'edges' as const,
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: GRAPH_EDGE_LABELS[edge.kind],
            color: EDGE_COLORS[edge.kind],
            kind: edge.kind,
          },
        })),
      ]
    }

    const TRANSITION = { duration: 450, easing: 'ease-out-cubic' as const }

    function renderGraph(transition = false) {
      if (!cy) return
      let previous = new Map(cy.nodes().map((node) => [node.id(), { ...node.position() }]))
      cy.elements().remove()
      cy.add(elements())
      // Seed positions in rings by hop distance, then let a force layout pull
      // substitutes next to their ingredient and spread crowded rings.
      cy.layout({
        name: 'concentric',
        concentric: (node) => 10 - Number(node.data('level')),
        levelWidth: () => 1,
        minNodeSpacing: 40,
        animate: false,
      }).run()
      cy.layout({
        name: 'cose',
        randomize: false,
        animate: false,
        idealEdgeLength: () => 110,
        nodeRepulsion: () => 60000,
        nodeOverlap: 40,
        gravity: 0.3,
        numIter: 1000,
        padding: 48,
      } as cytoscape.LayoutOptions).run()
      fitView()
      if (transition && !prefersReducedMotion()) animateIn(previous)
      if (selected) select(selected)
    }

    /**
     * Refocus transition: nodes that stay glide from their old spot, new nodes
     * grow out of the new centre, and edges fade in once nodes settle.
     */
    function animateIn(previous: Map<string, { x: number; y: number }>) {
      if (!cy) return
      let origin = cy.getElementById(graph.center).position()
      for (let node of cy.nodes()) {
        let target = { ...node.position() }
        let start = previous.get(node.id()) ?? origin
        let isNew = !previous.has(node.id())
        node.position(start)
        if (isNew) node.style('opacity', 0)
        node.animate({ position: target, style: { opacity: 1 } }, TRANSITION)
      }
      cy.edges().style('opacity', 0)
      cy.edges().animate({ style: { opacity: 1 } }, { duration: 300, easing: 'ease-out-cubic', queue: false })
    }

    function mount(container: HTMLElement, signal: AbortSignal) {
      cy = cytoscape({
        container,
        style: graphStyles(),
        minZoom: 0.3,
        maxZoom: 2.5,
        boxSelectionEnabled: false,
      })
      try {
        renderGraph()
      } catch (cause) {
        error = 'Graf gagal digambar. Gunakan tampilan Daftar.'
        console.error(cause)
      }
      cy.on('tap', 'node', (event) => select(event.target.id() as NodeKey))
      cy.on('dbltap', 'node', (event) => load({ center: event.target.id() }, true))
      cy.on('tap', (event) => {
        if (event.target === cy) select(null)
      })
      cy.on('zoom', () => {
        zoom = cy!.zoom()
        handle.update()
      })
      handle.update()
      signal.addEventListener('abort', () => {
        cy?.destroy()
        cy = null
      })
    }

    // Mount Cytoscape after the first browser commit (hydration adopts the server DOM).
    handle.queueTask(() => {
      let container = document.getElementById(canvasId)
      if (!container || cy) return
      try {
        mount(container, handle.signal)
      } catch (cause) {
        error = 'Graf gagal dimuat. Gunakan tampilan Daftar.'
        console.error(cause)
        handle.update()
      }
    })

    handle.queueTask(() => {
      window.addEventListener(
        'popstate',
        () => {
          let params = new URLSearchParams(window.location.search)
          let center = params.get('simpul')
          if (center && center !== state.center) load({ center }, false)
        },
        { signal: handle.signal },
      )
    })

    /** Fit the neighbourhood, but never below a readable zoom (then centre on the focus node). */
    function viewport(): { zoom: number; pan: { x: number; y: number } } | null {
      if (!cy) return null
      let saved = { zoom: cy.zoom(), pan: { ...cy.pan() } }
      cy.fit(undefined, 48)
      if (cy.zoom() > 1) cy.zoom({ level: 1, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
      let min = readableZoom(cy)
      if (cy.zoom() < min) {
        cy.zoom(min)
        cy.center(cy.getElementById(graph.center))
      }
      let target = { zoom: cy.zoom(), pan: { ...cy.pan() } }
      cy.viewport(saved)
      return target
    }

    function fitView() {
      let target = viewport()
      if (!cy || !target) return
      cy.viewport(target)
      zoom = cy.zoom()
    }

    function resetView() {
      let target = viewport()
      if (!cy || !target) return
      if (prefersReducedMotion()) cy.viewport(target)
      else cy.animate(target, { duration: 350, easing: 'ease-out-cubic' })
    }

    /** Keep the selected node in view: on mobile above the bottom sheet. */
    function revealNode(key: NodeKey) {
      if (!cy) return
      let node = cy.getElementById(key)
      let panel = document.getElementById(panelId)
      if (node.empty()) return
      let box = cy.container()!.getBoundingClientRect()
      let sheet = panel && window.innerWidth < 1024 ? panel.getBoundingClientRect().top - box.top : cy.height()
      let visible = Math.max(80, Math.min(cy.height(), sheet))
      let position = node.renderedPosition()
      let margin = 56
      if (position.y > margin && position.y < visible - margin && position.x > margin && position.x < cy.width() - margin) return
      let delta = { x: cy.width() / 2 - position.x, y: visible / 2 - position.y }
      if (prefersReducedMotion()) cy.panBy(delta)
      else cy.animate({ panBy: delta }, { duration: 300, easing: 'ease-out-cubic' })
    }

    function zoomBy(factor: number) {
      if (!cy) return
      let target = { level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }
      if (prefersReducedMotion()) cy.zoom(target)
      else cy.animate({ zoom: target }, { duration: 200, easing: 'ease-out-cubic' })
    }

    async function search(value: string) {
      searchQuery = value
      searchController?.abort()
      if (!value.trim()) {
        searchResults = []
        handle.update()
        return
      }
      searchController = new AbortController()
      try {
        let response = await fetch(`${routes.graph.search.href()}?q=${encodeURIComponent(value)}`, {
          signal: searchController.signal,
        })
        searchResults = response.ok ? await response.json() : []
        handle.update()
      } catch {
        // Superseded by a newer query.
      }
    }

    let depthOptions = () =>
      Array.from({ length: MAX_GRAPH_DEPTH }, (_, i) => i + 1).map((depth) => (
        <option key={depth} value={String(depth)} selected={depth === state.depth}>
          {depth} tingkat
        </option>
      ))

    return () => {
      let center = nodeByKey(graph.center)
      let selectedNode = nodeByKey(selected)
      let view = state.view
      let nodeCount = graph.nodes.length
      let edgeCount = graph.edges.length
      let kinds = visibleKinds(graph)

      return (
        <div class="flex h-[calc(100dvh-60px)] flex-col lg:h-[calc(100dvh-72px)]">
          {/* Toolbar */}
          <div class="flex min-h-14 items-center justify-between gap-1 border-b border-line pr-3 pl-2 lg:min-h-16 lg:gap-3 lg:px-6">
            <div class="flex min-w-0 items-center gap-1">
              <a
                href={routes.home.href()}
                class="flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-hover lg:hidden"
                aria-label="Kembali ke beranda"
              >
                <Icon name="arrow-left" size={20} />
              </a>
              <div class="flex min-w-0 flex-col gap-px lg:flex-row lg:items-center lg:gap-2.5">
                <span class="text-[11px] tracking-[0.02em] text-muted lg:hidden">Graf Resep</span>
                <span class="hidden text-sm text-muted lg:inline">Jelajahi Graf</span>
                <Icon name="chevron-right" size={14} class="hidden text-faint lg:block" />
                <h1 class="truncate text-base font-medium tracking-[0.01em] lg:text-lg lg:tracking-[-0.4px]">{center?.name}</h1>
                <span class={cn(badgeVariants(), 'hidden px-3.5 py-1.5 text-[13px] lg:inline-flex')}>
                  {nodeCount} simpul · {edgeCount} hubungan
                </span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="relative hidden lg:block">
                <label class="flex h-10 w-[300px] items-center gap-2.5 rounded-md border border-outline bg-bg px-3 focus-within:border-ink">
                  <Icon name="search" class="text-muted" />
                  <span class="sr-only">Cari resep atau bahan di graf</span>
                  <input
                    type="search"
                    value={searchQuery}
                    placeholder="Cari resep atau bahan di graf…"
                    class="h-full min-w-0 flex-1 bg-transparent text-[13px] tracking-[0.02em] placeholder:text-faint focus:outline-none"
                    mix={on('input', (event) => search(event.currentTarget.value))}
                  />
                </label>
                {searchResults.length > 0 && (
                  <ul class="absolute top-[calc(100%+6px)] right-0 left-0 z-30 rounded-md border border-line-strong bg-bg p-1.5 shadow-modal">
                    {searchResults.map((result) => (
                      <li key={result.key}>
                        <button
                          type="button"
                          class="flex min-h-9 w-full items-center gap-2.5 rounded-sm px-2.5 text-left text-sm hover:bg-hover"
                          mix={on('click', () => {
                            searchQuery = ''
                            searchResults = []
                            load({ center: result.key }, true)
                          })}
                        >
                          <Icon name={result.type === 'recipe' ? 'book-open' : 'leaf'} class="text-muted" />
                          <span class="flex-1 truncate">{result.name}</span>
                          <span class="text-xs text-muted">{result.type === 'recipe' ? 'Resep' : 'Bahan'}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div role="group" aria-label="Tampilan" class="flex shrink-0 gap-0.5 rounded-full border border-outline p-[3px]">
                {(['graf', 'daftar'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={view === option ? 'true' : 'false'}
                    class={cn(
                      'flex size-[34px] items-center justify-center gap-1.5 rounded-full text-[13px] font-medium lg:h-[29px] lg:w-auto lg:px-3.5',
                      view === option ? 'bg-surface-dark text-white' : 'text-ink hover:bg-hover',
                    )}
                    mix={on('click', () => setView(option))}
                  >
                    <Icon name={option === 'graf' ? 'waypoints' : 'list'} size={16} class="lg:size-3.5" />
                    <span class="sr-only lg:not-sr-only">{option === 'graf' ? 'Graf' : 'Daftar'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter chips: mobile, and the list view on desktop (the canvas overlay is hidden there) */}
          <div
            class={cn(
              'flex items-center gap-2 overflow-x-auto border-b border-line px-4 py-2.5',
              view === 'daftar' ? 'lg:px-6' : 'lg:hidden',
            )}
            role="group"
            aria-label="Filter hubungan"
          >
            {kinds.map((kind) => {
              let active = state.kinds.includes(kind)
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={active ? 'true' : 'false'}
                  class={cn(
                    badgeVariants({ variant: active ? 'selected' : 'chip-muted' }),
                    'h-[33px] shrink-0 gap-1.5 tracking-[0.02em]',
                    active ? 'pr-3 pl-2.5' : 'bg-bg pr-2.5 pl-3',
                  )}
                  mix={on('click', () => load({ kinds: toggleKind(state.kinds, kind) }, false))}
                >
                  {active && <Icon name="check" size={14} />}
                  {GRAPH_FILTER_LABELS[kind]}
                  {!active && <Icon name="plus" size={14} />}
                </button>
              )
            })}
            {view === 'daftar' && (
              <DepthSelect id="graph-depth-list" class="ml-auto shrink-0" value={state.depth} onChange={(depth) => load({ depth }, false)}>
                {depthOptions()}
              </DepthSelect>
            )}
          </div>

          <div class="relative flex min-h-0 flex-1">
            {/* Canvas */}
            <div class={cn('relative min-w-0 flex-1 bg-subtle lg:bg-hover', view !== 'graf' && 'hidden')}>
              <div class="absolute inset-0">
                <div
                  class="size-full"
                  aria-label={`Graf hubungan ${center?.name ?? ''}. Gunakan tampilan Daftar untuk navigasi dengan keyboard.`}
                  role="img"
                  id={canvasId}
                />
              </div>

              <fieldset class="absolute top-6 left-6 hidden w-[248px] rounded-lg bg-surface-dark p-5 text-white lg:block">
                <legend class="sr-only">Filter hubungan</legend>
                <button
                  type="button"
                  class="flex w-full items-center justify-between text-[13px] font-medium"
                  aria-expanded={filtersOpen ? 'true' : 'false'}
                  mix={on('click', () => {
                    filtersOpen = !filtersOpen
                    handle.update()
                  })}
                >
                  Filter hubungan
                  <Icon name={filtersOpen ? 'chevron-up' : 'chevron-down'} class="text-line-strong" />
                </button>
                {filtersOpen && (
                  <div class="mt-3.5 flex flex-col gap-3.5">
                    {kinds.map((kind) => {
                      let checked = state.kinds.includes(kind)
                      return (
                        <label key={kind} class="flex cursor-pointer items-center gap-2.5 text-[13px]">
                          <span class="relative flex size-4 shrink-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              class="peer size-4 cursor-pointer appearance-none rounded-[4px] border border-white/40 checked:border-white checked:bg-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                              mix={on('change', () => load({ kinds: toggleKind(state.kinds, kind) }, false))}
                            />
                            <Icon name="check" size={12} strokeWidth={3} class="pointer-events-none absolute inset-0 m-auto hidden text-surface-dark peer-checked:block" />
                          </span>
                          <span class={cn('flex-1', !checked && 'text-line-strong')}>{GRAPH_FILTER_LABELS[kind]}</span>
                          <span class="text-xs text-line-strong">{graph.kindCounts[kind]}</span>
                        </label>
                      )
                    })}
                    <div class="flex flex-row justify-between gap-2 border-t border-white/15 pt-3.5 text-xs whitespace-nowrap text-line-strong">
                      <span class="flex items-center gap-1.5">
                        <span class="size-3 rounded-full border border-white/50 bg-white/15" /> Resep
                      </span>
                      <span class="flex items-center gap-1.5">
                        <span class="size-3 rounded-[4px] border border-accent bg-accent-subtle" /> Bahan
                      </span>
                      <span class="flex items-center gap-1.5">
                        <span class="size-3 rounded-[4px] border border-warning bg-warning-subtle" /> Pengganti
                      </span>
                    </div>
                  </div>
                )}
              </fieldset>

              <DepthSelect id="graph-depth" class="absolute top-3 right-3 lg:top-6 lg:right-6" value={state.depth} onChange={(depth) => load({ depth }, false)}>
                {depthOptions()}
              </DepthSelect>

              {/* Zoom: vertical stack top-left on mobile, horizontal bar bottom-left on desktop */}
              <div class="absolute top-[160px] right-3 flex w-11 flex-col items-center rounded-md border border-line bg-bg p-0.5 lg:top-auto lg:right-auto lg:bottom-6 lg:left-6 lg:h-10 lg:w-auto lg:flex-row lg:gap-0.5 lg:rounded-full lg:border-0 lg:px-2 lg:py-0">
                <ZoomButton label="Perbesar" icon="plus" class="lg:order-3" onPress={() => zoomBy(1.2)} />
                <ZoomButton label="Perkecil" icon="minus" class="lg:order-1" onPress={() => zoomBy(1 / 1.2)} />
                <span class="hidden w-11 text-center text-xs font-medium text-muted lg:order-2 lg:block" aria-live="polite">
                  {Math.round(zoom * 100)}%
                </span>
                <span class="h-px w-6 bg-line lg:order-4 lg:h-5 lg:w-px" aria-hidden="true" />
                <Tooltip content="Atur ulang tampilan graf" side="top" class="lg:order-5">
                  <button
                    type="button"
                    aria-label="Atur ulang tampilan graf"
                    class="flex size-10 items-center justify-center gap-1.5 rounded-sm text-xs font-medium text-ink hover:bg-hover lg:h-8 lg:w-auto lg:rounded-full lg:px-2.5"
                    mix={on('click', () => resetView())}
                  >
                    <Icon name="rotate-ccw" size={18} class="lg:size-3.5" />
                    <span class="hidden lg:inline" aria-hidden="true">Atur ulang</span>
                  </button>
                </Tooltip>
              </div>

              <p class="absolute right-6 bottom-6 hidden items-center gap-1.5 text-xs text-muted lg:flex">
                <Icon name="mouse-pointer-click" size={14} />
                Klik simpul untuk detail · seret untuk menggeser
              </p>

              {graph.truncated && (
                <p class="absolute top-16 right-3 rounded-sm bg-bg px-2 py-1 text-xs text-muted lg:top-18 lg:right-6">
                  Ditampilkan {nodeCount} simpul terdekat
                </p>
              )}
              {(loading || error || !cy) && (
                <div class="absolute inset-0 flex items-center justify-center bg-subtle/70" aria-live="polite">
                  <p class="rounded-md border border-line bg-bg px-4 py-2.5 text-sm text-muted">
                    {error ?? 'Memuat graf…'}
                  </p>
                </div>
              )}
            </div>

            {view === 'daftar' && <RelationList graph={graph} onFocus={(key) => load({ center: key }, true)} />}

            {/* Detail panel / bottom sheet */}
            {selectedNode && view === 'graf' && (
              <NodePanel
                id={panelId}
                graph={graph}
                node={selectedNode}
                onClose={() => select(null)}
                onFocus={() => load({ center: selectedNode.key }, true)}
              />
            )}
          </div>
        </div>
      )
    }
  },
)

/** pen.dev Select ("Kedalaman 1 tingkat") backed by a native <select>. */
function DepthSelect(
  handle: Handle<{ id: string; value: number; class?: string; onChange: (depth: number) => void; children?: RemixNode }>,
) {
  return () => {
    let { id, class: className, onChange, children } = handle.props
    return (
      <div class={cn('flex h-10 items-center rounded-md border border-outline bg-bg pl-4 text-[13px] focus-within:border-ink', className)}>
        <label for={id} class="whitespace-nowrap text-muted">
          Kedalaman
        </label>
        <span class="relative flex h-full items-center">
          <select
            id={id}
            class="h-full cursor-pointer appearance-none bg-transparent pr-8 pl-2 font-medium focus:outline-none"
            mix={on('change', (event) => onChange(Number(event.currentTarget.value)))}
          >
            {children}
          </select>
          <Icon name="chevron-down" class="pointer-events-none absolute right-3 text-muted" />
        </span>
      </div>
    )
  }
}

function ZoomButton(
  handle: Handle<{ label: string; icon: 'plus' | 'minus'; class?: string; onPress: () => void }>,
) {
  return () => (
    <button
      type="button"
      aria-label={handle.props.label}
      class={cn('flex size-10 items-center justify-center rounded-sm hover:bg-hover lg:size-8 lg:rounded-full', handle.props.class)}
      mix={on('click', () => handle.props.onPress())}
    >
      <Icon name={handle.props.icon} size={18} class="lg:size-4" />
    </button>
  )
}

function NodePanel(
  handle: Handle<{ id: string; graph: GraphNeighborhood; node: GraphNode; onClose: () => void; onFocus: () => void }>,
) {
  return () => {
    let { id, graph, node, onClose, onFocus } = handle.props
    let center = graph.nodes.find((n) => n.key === graph.center)
    let edges = graph.edges.filter((edge) => edge.source === node.key || edge.target === node.key)
    let toCenter = edges.find((edge) => edge.source === graph.center || edge.target === graph.center)
    let href =
      node.type === 'recipe'
        ? routes.recipes.show.href({ id: node.id })
        : routes.ingredients.show.href({ id: node.id })
    let isCenter = node.key === graph.center
    let closeButton = (extra: string) => (
      <button
        type="button"
        aria-label="Tutup detail"
        class={cn('flex shrink-0 items-center justify-center text-muted hover:bg-hover', extra)}
        mix={on('click', () => onClose())}
      >
        <Icon name="x" size={16} class="lg:size-3.5" />
      </button>
    )

    return (
      <aside
        id={id}
        aria-label="Simpul dipilih"
        class="fixed inset-x-0 bottom-0 z-30 flex max-h-[60dvh] flex-col gap-3.5 overflow-y-auto rounded-t-lg border-t border-line bg-bg px-5 pt-2.5 pb-6 lg:static lg:max-h-none lg:w-[360px] lg:shrink-0 lg:gap-5 lg:rounded-none lg:border-t-0 lg:border-l lg:p-7"
      >
        <span class="mx-auto h-1 w-9 shrink-0 rounded-full bg-line-strong lg:hidden" aria-hidden="true" />
        <div class="hidden items-center justify-between lg:flex">
          <p class="text-xs font-medium text-muted">Simpul dipilih</p>
          {closeButton('size-7 rounded-full border border-outline text-ink')}
        </div>
        <div class="flex items-center gap-3.5 lg:flex-col lg:items-stretch lg:gap-5">
          <div class="size-[60px] shrink-0 overflow-hidden rounded-md bg-hover lg:aspect-[304/188] lg:size-auto lg:w-full lg:rounded-lg">
            {node.imageUrl ? (
              <img src={node.imageUrl} alt="" class="size-full object-cover" />
            ) : (
              <span class="flex size-full items-center justify-center text-accent">
                <Icon name="leaf" size={24} />
              </span>
            )}
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-[5px] lg:gap-2.5">
            {toCenter && center && !isCenter && (
              <span class="inline-flex items-center gap-[5px] self-start rounded-sm bg-accent-subtle px-1.5 py-0.5 text-[11px] font-medium tracking-[0.01em] text-accent-strong lg:gap-1.5 lg:rounded-full lg:bg-surface-dark lg:px-3 lg:py-[5px] lg:text-xs lg:tracking-normal lg:text-white">
                <Icon name={KIND_ICONS[toCenter.kind]} size={12} class="lg:size-[13px]" />
                {GRAPH_FILTER_LABELS[toCenter.kind]} · {center.name}
              </span>
            )}
            <h2 class="text-xl font-medium lg:text-[34px] lg:leading-[37px] lg:font-normal lg:tracking-[-0.34px]">{node.name}</h2>
            {node.recipe && (
              <>
                <p class="text-xs tracking-[0.02em] text-muted lg:hidden">
                  {formatMinutes(node.recipe.totalMinutes)} · {difficultyLabel(node.recipe.difficulty)} · {node.recipe.authorName}
                </p>
                <div class="hidden flex-wrap gap-x-3 gap-y-1 lg:flex">
                  <MetaItem icon="clock-3">{formatMinutes(node.recipe.totalMinutes)}</MetaItem>
                  <MetaItem icon="signal">{difficultyLabel(node.recipe.difficulty)}</MetaItem>
                  <MetaItem icon="user-round">{node.recipe.authorName}</MetaItem>
                </div>
              </>
            )}
          </div>
          {closeButton('size-9 rounded-full bg-hover lg:hidden')}
        </div>
        {node.recipe?.description && (
          <p class="text-sm leading-[21px] tracking-[0.02em] text-muted lg:text-[15px] lg:leading-[23px]">{node.recipe.description}</p>
        )}

        {edges.length > 0 && (
          <div class="hidden flex-col gap-2.5 rounded-md bg-[linear-gradient(-106.7deg,#f2c9a0bf_9%,#ebcfc0bf_91%)] p-[18px] lg:flex">
            <p class="text-[13px] font-medium">Mengapa terhubung</p>
            <ul class="flex flex-col gap-2.5">
              {edges.map((edge) => (
                <EdgeReason key={edge.id} edge={edge} node={node} graph={graph} />
              ))}
            </ul>
          </div>
        )}

        <div class="flex gap-2 lg:mt-auto lg:flex-col lg:gap-2.5">
          <ButtonLink href={href} variant="default" class="h-12 min-w-0 flex-1 px-5 text-[15px] lg:w-full lg:flex-none">
            {node.type === 'recipe' ? 'Lihat Resep' : 'Lihat Bahan'}
            <Icon name="arrow-right" />
          </ButtonLink>
          {!isCenter && (
            <Button
              type="button"
              variant="outline"
              class="h-12 px-5 text-[15px] lg:w-full lg:border-transparent lg:bg-surface-dark lg:text-white lg:hover:bg-ink"
              mix={on('click', () => onFocus())}
            >
              <Icon name="locate-fixed" />
              <span class="lg:hidden">Jadikan pusat</span>
              <span class="hidden lg:inline">Jadikan pusat graf</span>
            </Button>
          )}
        </div>
      </aside>
    )
  }
}

function EdgeReason(handle: Handle<{ edge: GraphEdge; node: GraphNode; graph: GraphNeighborhood }>) {
  return () => {
    let { edge, node, graph } = handle.props
    let otherKey = edge.source === node.key ? edge.target : edge.source
    let other = graph.nodes.find((n) => n.key === otherKey)
    return (
      <li class="flex gap-2 text-[13px] leading-[19px]">
        <Icon name={KIND_ICONS[edge.kind]} size={15} class="mt-0.5 text-accent-strong" />
        <span>
          {describeEdge(edge, node, other)}
          {edge.label && <span class="text-ink/70"> — {edge.label}</span>}
        </span>
      </li>
    )
  }
}

function describeEdge(edge: GraphEdge, node: GraphNode, other: GraphNode | undefined): string {
  let name = other?.name ?? 'simpul lain'
  let outgoing = edge.source === node.key
  switch (edge.kind) {
    case 'variation_of':
      return outgoing ? `Variasi dari ${name}` : `${name} adalah variasinya`
    case 'uses':
      return outgoing ? `Memakai ${name}` : `Dipakai di ${name}`
    case 'substitute_for':
      return outgoing ? `Bisa diganti ${name}` : `Pengganti untuk ${name}`
    case 'inspired_by':
      return outgoing ? `Terinspirasi dari ${name}` : `Menginspirasi ${name}`
    case 'similar_to':
      return `Serupa dengan ${name}`
    case 'pairs_with':
      return `Berpasangan dengan ${name}`
    case 'same_category':
      return `Kategori sama dengan ${name}`
  }
}

function RelationList(handle: Handle<{ graph: GraphNeighborhood; onFocus: (key: NodeKey) => void }>) {
  return () => {
    let { graph, onFocus } = handle.props
    let byKind = GRAPH_EDGE_KINDS.map((kind) => ({
      kind,
      edges: graph.edges.filter((edge) => edge.kind === kind),
    })).filter((group) => group.edges.length > 0)
    let nodes = new Map(graph.nodes.map((node) => [node.key, node]))
    let link = (node: GraphNode | undefined) =>
      node && (
        <a
          href={node.type === 'recipe' ? routes.recipes.show.href({ id: node.id }) : routes.ingredients.show.href({ id: node.id })}
          class="font-medium hover:underline"
        >
          {node.name}
        </a>
      )

    return (
      <div class="flex-1 overflow-y-auto">
        <div class="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-8">
          {byKind.length === 0 && <p class="text-sm text-muted">Tidak ada hubungan untuk filter yang dipilih.</p>}
          {byKind.map((group) => (
            <section key={group.kind} aria-labelledby={`daftar-${group.kind}`} class="flex flex-col gap-3">
              <h2 id={`daftar-${group.kind}`} class="flex items-center gap-2 text-base font-semibold">
                <Icon name={KIND_ICONS[group.kind]} class="text-accent" />
                {GRAPH_FILTER_LABELS[group.kind]}
                <span class={badgeVariants()}>{group.edges.length}</span>
              </h2>
              <ul class="flex flex-col rounded-lg border border-line">
                {group.edges.map((edge) => {
                  let source = nodes.get(edge.source)
                  let target = nodes.get(edge.target)
                  let other = edge.source === graph.center ? target : source
                  return (
                    <li key={edge.id} class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3 text-sm last:border-b-0">
                      <span class="flex-1">
                        {link(source)} <span class="text-muted">— {GRAPH_EDGE_LABELS[edge.kind]} →</span> {link(target)}
                        {edge.label && <span class="block text-[13px] text-muted">{edge.label}</span>}
                      </span>
                      {other && other.key !== graph.center && (
                        <Button
                          type="button" variant="ghost" size="sm"
                          mix={on('click', () => onFocus(other!.key))}
                        >
                          <Icon name="locate-fixed" size={14} />
                          Jadikan pusat
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    )
  }
}

function toggleKind(kinds: GraphEdgeKind[], kind: GraphEdgeKind): GraphEdgeKind[] {
  let next = kinds.includes(kind) ? kinds.filter((k) => k !== kind) : [...kinds, kind]
  return next.length > 0 ? next : kinds
}

/** Hop distance from the centre, for the concentric layout rings. */
function distances(graph: GraphNeighborhood): Map<NodeKey, number> {
  let levels = new Map<NodeKey, number>([[graph.center, 0]])
  let frontier: NodeKey[] = [graph.center]
  while (frontier.length > 0) {
    let next: NodeKey[] = []
    for (let key of frontier) {
      for (let edge of graph.edges) {
        let other = edge.source === key ? edge.target : edge.target === key ? edge.source : null
        if (other && !levels.has(other)) {
          levels.set(other, levels.get(key)! + 1)
          next.push(other)
        }
      }
    }
    frontier = next
  }
  return levels
}

function graphStyles(): StylesheetJson {
  let font = "'Familjen Grotesk', ui-sans-serif, system-ui, sans-serif"
  return [
    {
      selector: 'node',
      style: {
        'font-family': font,
        'font-size': 12,
        'font-weight': 500,
        color: COLOR.ink,
        label: 'data(name)',
        'text-wrap': 'none',
        'overlay-opacity': 0,
      },
    },
    {
      selector: 'node[type = "recipe"]',
      style: {
        shape: 'ellipse',
        width: 64,
        height: 64,
        'background-color': COLOR.hover,
        'background-image': 'data(image)',
        'background-fit': 'cover',
        'border-width': 1,
        'border-color': COLOR.lineStrong,
        'text-valign': 'bottom',
        'text-margin-y': 8,
        'text-background-color': COLOR.bg,
        'text-background-opacity': 1,
        'text-background-shape': 'round-rectangle',
        'text-background-padding': '5px',
        'text-border-width': 1,
        'text-border-color': COLOR.line,
        'text-border-opacity': 1,
      },
    },
    { selector: 'node.no-image', style: { 'background-image': 'none' } },
    {
      selector: 'node[type = "ingredient"]',
      style: {
        shape: 'round-rectangle',
        'corner-radius': 14,
        width: 'data(labelWidth)',
        height: 30,
        'background-color': COLOR.subtle,
        'background-image': nodeDot(COLOR.accentSubtle, COLOR.accent, 'leaf'),
        'background-fit': 'none',
        'background-clip': 'none',
        'background-width': 18,
        'background-height': 18,
        'background-position-x': 8,
        'background-position-y': '50%',
        'border-width': 1,
        'border-color': COLOR.lineStrong,
        'text-valign': 'center',
        'text-halign': 'center',
        'text-margin-x': 12,
      },
    },
    {
      // Substitutes keep the neutral pill; only the glyph changes.
      selector: 'node.substitute',
      style: { 'background-image': nodeDot(COLOR.warningSubtle, COLOR.warning, 'arrow-left-right') },
    },
    {
      selector: 'node.center',
      style: {
        width: 104,
        height: 104,
        'border-width': 3,
        'border-color': COLOR.ink,
        'font-size': 13,
        'font-weight': 600,
        color: COLOR.bg,
        'text-background-color': COLOR.surfaceDark,
        'text-background-padding': '6px',
        'text-border-color': COLOR.surfaceDark,
      },
    },
    {
      selector: 'node[type = "ingredient"].center',
      style: { width: 'data(labelWidth)', height: 36, 'background-color': COLOR.surfaceDark, 'text-background-opacity': 0 },
    },
    {
      selector: 'node.selected',
      style: {
        'border-width': 3,
        'border-color': COLOR.accent,
        color: COLOR.accentStrong,
        'font-weight': 600,
        'text-background-color': COLOR.accentSubtle,
        'text-border-color': COLOR.accent,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.25,
        'line-color': 'data(color)',
        'curve-style': 'straight',
        'line-cap': 'round',
        label: 'data(label)',
        'font-family': font,
        'font-size': 11,
        'font-weight': 500,
        color: COLOR.muted,
        'text-background-color': COLOR.bg,
        'text-background-opacity': 1,
        'text-background-shape': 'round-rectangle',
        'text-background-padding': '3px',
        'text-border-width': 1,
        'text-border-color': COLOR.line,
        'text-border-opacity': 1,
        'overlay-opacity': 0,
      },
    },
    { selector: 'edge[kind = "substitute_for"]', style: { color: COLOR.warning } },
    { selector: 'edge[kind = "same_category"]', style: { 'line-style': 'dashed' } },
    {
      selector: 'edge.highlight',
      style: {
        width: 2,
        'line-color': COLOR.accent,
        color: COLOR.accentStrong,
        'text-background-color': COLOR.accentSubtle,
        'text-border-color': COLOR.accent,
        'z-index': 10,
      },
    },
  ] as StylesheetJson
}
