import type { Handle } from 'remix/component'

import type { GraphNeighborhood } from '../../domain/graph.ts'
import { SiteLayout } from '../../ui/layout.tsx'
import type { Shell } from '../../ui/shell.ts'
import { GraphExplorer } from './public/graph-explorer.tsx'
import type { GraphParams } from './public/params.ts'
import { cn, pageX } from '../../ui/utils.ts'

export function GraphPage(handle: Handle<{ shell: Shell; graph: GraphNeighborhood; state: GraphParams }>) {
  return () => {
    let { shell, graph, state } = handle.props
    let center = graph.nodes.find((node) => node.key === graph.center)
    return (
      <SiteLayout shell={shell} active="graph" footer={false} fullWidth title={`Graf · ${center?.name ?? 'Resep'}`}>
        <GraphExplorer initial={graph} state={state} />
        <noscript>
          <p class={cn(pageX, 'py-4 text-sm text-muted')}>
            Graf interaktif membutuhkan JavaScript. Hubungan yang sama tersedia di tampilan Daftar.
          </p>
        </noscript>
      </SiteLayout>
    )
  }
}
