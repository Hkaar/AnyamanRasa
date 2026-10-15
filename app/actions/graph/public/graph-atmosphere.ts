// The "living" layers around the Cytoscape graph (pen.dev 05 Graf Resep, Canvas → Backdrop and
// Edges → Flow Particles). Cytoscape cannot draw these itself, so two transparent canvases sit
// under and over its own: the underlay holds the soft glow behind the centre recipe; the overlay
// holds small dots travelling along each relation's curve. Both follow pan and zoom. With reduced
// motion everything is drawn still.
import type { Core, EdgeSingular, Position } from 'cytoscape'

import type { GraphEdgeKind } from '../../../domain/graph.ts'

interface Particle {
  color: string
  /** Dot radius in model units (scaled with zoom, within limits). */
  radius: number
  /** Dots per edge. */
  count: number
  /** Edge lengths per second. */
  speed: number
}

/** Flow dots per relation type, in the colours of their lines. */
const PARTICLES: Partial<Record<GraphEdgeKind, Particle>> = {
  similar_to: { color: '#D2693F', radius: 3.5, count: 2, speed: 0.16 },
  variation_of: { color: '#A8491F', radius: 3, count: 1, speed: 0.13 },
  pairs_with: { color: '#76655B', radius: 2.5, count: 1, speed: 0.1 },
  uses: { color: '#A09186', radius: 2.5, count: 1, speed: 0.08 },
  substitute_for: { color: '#8A6A2E', radius: 2.5, count: 1, speed: 0.11 },
}

export interface AtmosphereLayers {
  underlay: HTMLCanvasElement
  overlay: HTMLCanvasElement
  /** Element whose CSS dot grid follows pan and zoom. */
  grid: HTMLElement
}

export function startAtmosphere(cy: Core, layers: AtmosphereLayers, signal: AbortSignal) {
  let still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let under = layers.underlay.getContext('2d')
  let over = layers.overlay.getContext('2d')
  if (!under || !over) return

  function resize() {
    let ratio = window.devicePixelRatio || 1
    for (let canvas of [layers.underlay, layers.overlay]) {
      let { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
  }

  function draw(time: number) {
    let seconds = still ? 0 : time / 1000
    let zoom = cy.zoom()
    let pan = cy.pan()
    let toScreen = (p: Position) => ({ x: p.x * zoom + pan.x, y: p.y * zoom + pan.y })

    let size = 24 * zoom
    layers.grid.style.backgroundSize = `${size}px ${size}px`
    layers.grid.style.backgroundPosition = `${pan.x}px ${pan.y}px`

    clear(under!, layers.underlay)
    clear(over!, layers.overlay)

    let center = cy.nodes('.center')
    if (center.nonempty()) drawBackdrop(under!, toScreen(center.first().position()), zoom)

    let focused = cy.edges('.highlight').nonempty()
    cy.edges().forEach((edge) => {
      let particle = PARTICLES[edge.data('kind') as GraphEdgeKind]
      if (!particle || edge.hidden()) return
      let alpha = focused && !edge.hasClass('highlight') ? 0.3 : 1
      drawParticles(over!, edge, particle, toScreen, zoom, seconds, alpha)
    })
  }

  resize()
  let observer = new ResizeObserver(() => {
    resize()
    draw(performance.now())
  })
  observer.observe(layers.overlay)

  let frame = 0
  if (still) {
    let redraw = () => draw(0)
    cy.on('render', redraw)
    redraw()
  } else {
    let loop = (time: number) => {
      draw(time)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
  }

  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
  })
}

function clear(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  context.save()
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.restore()
}

function drawBackdrop(context: CanvasRenderingContext2D, center: Position, zoom: number) {
  // Soft terracotta-to-peach glow behind the centre recipe.
  let glow = context.createRadialGradient(center.x, center.y, 0, center.x, center.y, 230 * zoom)
  glow.addColorStop(0, 'rgba(232, 145, 106, 0.28)')
  glow.addColorStop(0.45, 'rgba(242, 201, 160, 0.15)')
  glow.addColorStop(1, 'rgba(242, 201, 160, 0)')
  context.fillStyle = glow
  context.fillRect(center.x - 230 * zoom, center.y - 230 * zoom, 460 * zoom, 460 * zoom)
}

function drawParticles(
  context: CanvasRenderingContext2D,
  edge: EdgeSingular,
  particle: Particle,
  toScreen: (p: Position) => Position,
  zoom: number,
  seconds: number,
  alpha: number,
) {
  let start = toScreen(edge.sourceEndpoint())
  let end = toScreen(edge.targetEndpoint())
  let control = edge.controlPoints()?.[0]
  let middle = control ? toScreen(control) : { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  // Stagger edges so their dots do not move in lockstep.
  let offset = hash(edge.id())
  let radius = Math.min(Math.max(particle.radius * zoom, 1.8), 5)

  context.globalAlpha = alpha
  for (let i = 0; i < particle.count; i++) {
    let t = (offset + i / particle.count + seconds * particle.speed) % 1
    // Fade in and out near the nodes so dots never pop over a node.
    let edgeFade = Math.min(1, t / 0.12, (1 - t) / 0.12)
    let point = quadratic(start, middle, end, t)

    context.globalAlpha = alpha * edgeFade * 0.22
    context.fillStyle = particle.color
    context.beginPath()
    context.arc(point.x, point.y, radius * 2.4, 0, Math.PI * 2)
    context.fill()

    context.globalAlpha = alpha * edgeFade
    context.beginPath()
    context.arc(point.x, point.y, radius, 0, Math.PI * 2)
    context.fill()
    context.strokeStyle = '#FFFFFF'
    context.lineWidth = 1.5
    context.stroke()
  }
  context.globalAlpha = 1
}

function quadratic(a: Position, control: Position, b: Position, t: number): Position {
  let u = 1 - t
  return {
    x: u * u * a.x + 2 * u * t * control.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * control.y + t * t * b.y,
  }
}

function hash(text: string): number {
  let value = 0
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0
  return (value % 1000) / 1000
}
