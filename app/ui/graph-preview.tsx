import type { Handle } from 'remix/component'

import { GRAPH_EDGE_LABELS, type GraphNeighborhood, type GraphNode } from '../domain/graph.ts'
import { routes } from '../routes.ts'
import { Icon } from './icon.tsx'
import { cn } from './utils.ts'

type Point = { x: number; y: number }

/**
 * Fixed slots (percent of the canvas) taken from the pen.dev home design.
 * Recipe slots mark the thumbnail centre; ingredient slots the chip centre.
 */
const LAYOUTS = {
  desktop: {
    center: { x: 50, y: 42 },
    recipes: [
      { x: 18.6, y: 19.2 },
      { x: 82.9, y: 18.4 },
      { x: 84.4, y: 68 },
    ],
    ingredients: [
      { x: 17.1, y: 60 },
      { x: 45.7, y: 82.4 },
      { x: 67.2, y: 89.2 },
      { x: 35.7, y: 8 },
    ],
  },
  mobile: {
    center: { x: 50, y: 46.9 },
    recipes: [
      { x: 22.9, y: 17.5 },
      { x: 77.9, y: 19.4 },
    ],
    ingredients: [
      { x: 20, y: 78.1 },
      { x: 80, y: 78.1 },
    ],
  },
} satisfies Record<string, { center: Point; recipes: Point[]; ingredients: Point[] }>

type Variant = keyof typeof LAYOUTS

type Tone = 'light' | 'dark'

/**
 * Static preview of a real graph neighbourhood (homepage). The only control
 * opens the full graph explorer centred on the same recipe. `dark` is the
 * brown canvas of the redesigned home page.
 */
export function GraphPreview(handle: Handle<{ graph: GraphNeighborhood; tone?: Tone; class?: string }>) {
  return () => {
    let { graph, tone = 'light' } = handle.props
    let dark = tone === 'dark'
    let center = graph.nodes.find((node) => node.key === graph.center)
    if (!center) return null
    let shown = Math.min(
      graph.nodes.length - 1,
      LAYOUTS.desktop.recipes.length + LAYOUTS.desktop.ingredients.length,
    )

    return (
      <figure
        class={cn(
          'relative overflow-hidden rounded-lg',
          dark ? 'bg-surface-dark' : 'border border-line bg-subtle',
          handle.props.class,
        )}
        aria-label={`Pratinjau graf: ${center.name} dan ${shown} simpul terhubung`}
      >
        <PreviewLayer graph={graph} center={center} variant="mobile" tone={tone} />
        <PreviewLayer graph={graph} center={center} variant="desktop" tone={tone} />
        <a
          href={`${routes.graph.index.href()}?simpul=${center.key}`}
          aria-label="Buka di Graf Resep"
          class={cn(
            'absolute top-4 right-4 hidden items-center gap-0.5 rounded-full p-1 focus-visible:outline-2 md:flex',
            dark
              ? 'bg-white/10 text-white/70 hover:text-white focus-visible:outline-white'
              : 'border border-line bg-bg text-muted hover:text-ink focus-visible:outline-ink',
          )}
        >
          {(['minus', 'plus', 'maximize-2'] as const).map((icon) => (
            <span key={icon} class="flex size-6 items-center justify-center">
              <Icon name={icon} size={14} />
            </span>
          ))}
        </a>
        <figcaption
          class={cn(
            'absolute bottom-[18px] left-4 flex gap-3 text-[11px] md:bottom-6 md:left-5 md:gap-4 md:text-xs',
            dark ? 'text-faint' : 'text-muted',
          )}
        >
          <span class="flex items-center gap-1.5">
            <span class={cn('size-1.5 rounded-full md:size-[7px]', dark ? 'bg-sand' : 'bg-ink')} /> Resep
          </span>
          <span class="flex items-center gap-1.5">
            <span class="size-1.5 rounded-full bg-accent md:size-[7px]" /> Bahan
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-0.5 w-3 bg-accent md:w-3.5" /> Variasi
          </span>
        </figcaption>
      </figure>
    )
  }
}

function PreviewLayer(
  handle: Handle<{ graph: GraphNeighborhood; center: GraphNode; variant: Variant; tone: Tone }>,
) {
  return () => {
    let { graph, center, variant, tone } = handle.props
    let dark = tone === 'dark'
    let layout = LAYOUTS[variant]
    let desktop = variant === 'desktop'
    let recipes = graph.nodes.filter((n) => n.key !== center.key && n.type === 'recipe').slice(0, layout.recipes.length)
    let ingredients = graph.nodes.filter((n) => n.type === 'ingredient').slice(0, layout.ingredients.length)
    let placed: { node: GraphNode; x: number; y: number }[] = [
      { node: center, ...layout.center },
      ...recipes.map((node, i) => ({ node, ...layout.recipes[i]! })),
      ...ingredients.map((node, i) => ({ node, ...layout.ingredients[i]! })),
    ]
    let position = new Map(placed.map((p) => [p.node.key, p]))
    let edges = graph.edges.filter((e) => position.has(e.source) && position.has(e.target))

    return (
      <div class={cn('absolute inset-0', desktop ? 'hidden md:block' : 'md:hidden')}>
        <svg class="absolute inset-0 size-full" aria-hidden="true">
          {edges.map((edge) => {
            let a = position.get(edge.source)!
            let b = position.get(edge.target)!
            let variation = edge.kind === 'variation_of'
            return (
              <line
                key={edge.id}
                x1={`${a.x}%`}
                y1={`${a.y}%`}
                x2={`${b.x}%`}
                y2={`${b.y}%`}
                stroke={variation ? 'var(--color-accent)' : dark ? 'var(--color-faint)' : 'var(--color-line-strong)'}
                stroke-width={variation ? 1.5 : 1}
              />
            )
          })}
        </svg>
        {desktop &&
          edges
            .filter((edge) => edge.kind !== 'uses')
            .map((edge) => {
              let a = position.get(edge.source)!
              let b = position.get(edge.target)!
              return (
                <span
                  key={`label-${edge.id}`}
                  aria-hidden="true"
                  style={{ left: `${(a.x + b.x) / 2}%`, top: `${(a.y + b.y) / 2}%` }}
                  class={cn(
                    'absolute -translate-x-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[11px] font-medium',
                    dark ? 'bg-surface-dark' : 'bg-subtle',
                    edge.kind === 'variation_of' ? (dark ? 'text-accent' : 'text-accent-strong') : 'text-faint',
                  )}
                >
                  {GRAPH_EDGE_LABELS[edge.kind]}
                </span>
              )
            })}
        {placed.map(({ node, x, y }) => (
          <PreviewNode key={node.key} node={node} x={x} y={y} center={node.key === center.key} dark={dark} />
        ))}
      </div>
    )
  }
}

function PreviewNode(handle: Handle<{ node: GraphNode; x: number; y: number; center: boolean; dark: boolean }>) {
  return () => {
    let { node, x, y, center, dark } = handle.props
    let style = { left: `${x}%`, top: `${y}%` }
    if (node.type === 'ingredient') {
      return (
        <span
          style={style}
          class="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-md border border-line-strong bg-subtle py-1.5 pr-3 pl-2 text-xs font-medium whitespace-nowrap"
        >
          <span class="flex size-[18px] items-center justify-center rounded-xs bg-accent-subtle text-accent">
            <Icon name="leaf" size={12} />
          </span>
          {node.name}
        </span>
      )
    }
    // Anchored on the thumbnail centre so edges meet the circle; the label hangs below.
    return (
      <span style={style} class="absolute -translate-x-1/2 -translate-y-1/2">
        <span
          class={cn(
            'block overflow-hidden rounded-full bg-hover',
            center ? 'size-[72px] border-2 border-accent md:size-[88px]' : 'size-12 border-2 border-line-strong md:size-14',
          )}
        >
          {node.imageUrl && <img src={node.imageUrl} alt="" class="size-full object-cover" loading="lazy" />}
        </span>
        <span
          class={cn(
            'absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap md:text-xs',
            center
              ? dark
                ? 'border-accent bg-accent text-white'
                : 'border-ink bg-ink text-white'
              : 'border-line bg-bg text-ink',
          )}
        >
          {node.name}
        </span>
      </span>
    )
  }
}
