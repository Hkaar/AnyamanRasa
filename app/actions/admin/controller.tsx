import { createController } from 'remix/router'

import { listAdminRecipes } from '../../data/admin.ts'
import type { RecipeStatus } from '../../domain/types.ts'
import { routes } from '../../routes.ts'
import { parseFilters, requireAdmin } from './access.tsx'

const CSV_STATUS: Record<RecipeStatus, string> = { draft: 'Draf', published: 'Terbit', archived: 'Diarsipkan' }

function csvCell(value: string): string {
  // Neutralise spreadsheet formula injection, then quote.
  let safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export default createController(routes.admin, {
  actions: {
    async exportCsv(context) {
      let denied = requireAdmin(context)
      if (denied) return denied
      let filters = parseFilters(context.url.searchParams)
      let { rows } = await listAdminRecipes(context.db, { ...filters, page: 1 }, 10_000)
      let lines = [
        ['ID', 'Judul', 'Penulis', 'Kategori', 'Status', 'Variasi', 'Diperbarui'].map(csvCell).join(','),
        ...rows.map((row) =>
          [row.id, row.title, row.authorName, row.categories.join(' · '), CSV_STATUS[row.status], row.isVariation ? 'Ya' : 'Tidak', row.updatedAt]
            .map(csvCell)
            .join(','),
        ),
      ]
      return new Response(`﻿${lines.join('\r\n')}\r\n`, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="resep-anyamanrasa.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    },
  },
})
