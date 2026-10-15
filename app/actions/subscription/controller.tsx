import { createController } from 'remix/router'

import { formatPhone, normalizePhone, parseCheckout } from '../../domain/subscription.ts'
import { routes } from '../../routes.ts'
import { getShell, requireViewer } from '../shell.tsx'
import { DonePage, PendingPage, PlanPage } from './page.tsx'

/** Simulated checkout (pen.dev 14a, 14c, 14d): every step reads its choices from the query string. */
export default createController(routes.subscription, {
  actions: {
    index(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      return context.render(<PlanPage shell={getShell(context)} checkout={parseCheckout(context.url.searchParams)} />)
    },

    pending(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let phone = normalizePhone(context.url.searchParams.get('hp') ?? '')
      return context.render(
        <PendingPage
          shell={getShell(context)}
          checkout={parseCheckout(context.url.searchParams)}
          phone={phone ? formatPhone(phone) : null}
        />,
      )
    },

    done(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let today = new Date().toISOString().slice(0, 10).replaceAll('-', '')
      let orderNumber = `AR-${today}-${String(Math.floor(1000 + Math.random() * 9000))}`
      return context.render(
        <DonePage shell={getShell(context)} checkout={parseCheckout(context.url.searchParams)} orderNumber={orderNumber} />,
      )
    },
  },
})
