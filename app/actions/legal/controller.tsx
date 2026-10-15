import { createController } from 'remix/router'

import { routes } from '../../routes.ts'
import { getShell } from '../shell.tsx'
import { LegalPage } from './page.tsx'

export default createController(routes.legal, {
  actions: {
    terms(context) {
      return context.render(<LegalPage shell={getShell(context)} doc="terms" />)
    },

    privacy(context) {
      return context.render(<LegalPage shell={getShell(context)} doc="privacy" />)
    },
  },
})
