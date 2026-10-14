import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import {
  ADMIN_PAGE_SIZE,
  getAdminStats,
  listAdminRecipes,
  type ModerationAction,
  moderateRecipes,
} from '../../../data/admin.ts'
import { isUuid, listCategories } from '../../../data/recipes.ts'
import { routes } from '../../../routes.ts'
import { getShell, setFlash } from '../../shell.tsx'
import { parseFilters, requireAdmin } from '../access.tsx'
import { AdminRecipesPage } from '../page.tsx'

export default createController(routes.admin.recipes, {
  actions: {
    async index(context) {
      let denied = requireAdmin(context)
      if (denied) return denied
      let filters = parseFilters(context.url.searchParams)
      let [list, stats, categories] = await Promise.all([
        listAdminRecipes(context.db, filters),
        getAdminStats(context.db),
        listCategories(context.db),
      ])
      return context.render(
        <AdminRecipesPage
          shell={getShell(context)}
          filters={filters}
          rows={list.rows}
          total={list.total}
          pageSize={ADMIN_PAGE_SIZE}
          stats={stats}
          categories={categories}
        />,
      )
    },

    async action(context) {
      let denied = requireAdmin(context)
      if (denied) return denied
      let action = context.formData.get('aksi')
      let ids = context.formData
        .getAll('resep')
        .filter((value): value is string => typeof value === 'string' && isUuid(value))
      let back = context.formData.get('kembali')
      let target = typeof back === 'string' && back.startsWith('/admin/') ? back : routes.admin.recipes.index.href()

      if ((action !== 'archive' && action !== 'restore') || ids.length === 0) {
        setFlash(context, { message: 'Pilih minimal satu resep terlebih dahulu.' })
        return redirect(target, 303)
      }
      let changed = await moderateRecipes(context.db, ids, action as ModerationAction)
      let verb = action === 'archive' ? 'diarsipkan' : 'diterbitkan ulang'
      let skipped = ids.length - changed.length
      setFlash(context, {
        message:
          changed.length === 1
            ? `Resep “${changed[0]}” ${verb}.`
            : `${changed.length} resep ${verb}.${skipped > 0 ? ` ${skipped} dilewati karena statusnya tidak sesuai.` : ''}`,
      })
      return redirect(target, 303)
    },
  },
})
