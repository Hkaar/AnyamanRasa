import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import { authErrorMessage, getAuthProvider } from '../../../data/auth-provider.ts'
import { findEmailForLogin, linkIdentity } from '../../../data/users.ts'
import { text } from '../../../domain/validation.ts'
import { routes } from '../../../routes.ts'
import { getShell, safeRedirectTarget, setFlash } from '../../shell.tsx'
import { LoginPage } from '../pages.tsx'
import { loginErrorMessage, signIn } from '../sign-in.ts'

export default createController(routes.auth.login, {
  actions: {
    index(context) {
      if (context.viewer) return redirect(routes.home.href(), 303)
      let redirectTo = safeRedirectTarget(context.url.searchParams.get('ke'), '')
      let notice = context.url.searchParams.has('terkonfirmasi')
        ? 'Email terkonfirmasi. Silakan masuk.'
        : undefined
      let error = loginErrorMessage(context.url.searchParams.get('galat'))
      // "Masuk dengan email ini" on the sign-up page carries the address over.
      let email = text(context.url.searchParams.get('email'))
      return context.render(
        <LoginPage
          shell={getShell(context)}
          redirectTo={redirectTo}
          notice={notice}
          values={email ? { email } : undefined}
          errors={error ? { form: error } : {}}
        />,
      )
    },

    async action(context) {
      let login = text(context.formData.get('email'))
      let password = context.formData.get('password')
      let redirectTo = safeRedirectTarget(context.formData.get('ke'), routes.home.href())
      let errors: { email?: string; password?: string; form?: string; formTitle?: string } = {}
      if (!login) errors.email = 'Email wajib diisi.'
      if (typeof password !== 'string' || password.length === 0) errors.password = 'Kata sandi wajib diisi.'

      let renderError = () =>
        context.render(
          <LoginPage shell={getShell(context)} redirectTo={redirectTo} values={{ email: login }} errors={errors} />,
          { status: 400 },
        )
      if (Object.keys(errors).length > 0) return renderError()

      let email = await findEmailForLogin(context.db, login)
      let result = await getAuthProvider().signInWithPassword(email, password as string)
      if (!result.ok) {
        if (result.error === 'invalid-credentials') {
          errors.formTitle = authErrorMessage(result.error)
          errors.form = 'Periksa lagi ejaannya. Huruf besar dan kecil pada kata sandi dibedakan.'
          errors.password = 'Kata sandi tidak cocok dengan email ini.'
        } else {
          errors.form = authErrorMessage(result.error)
        }
        return renderError()
      }

      // Password accounts accepted the terms when they signed up.
      let link = await linkIdentity(context.db, result.value, { create: true })
      if (!link.ok) {
        errors.form = 'Akun ini tidak dapat ditautkan. Hubungi admin AnyamanRasa.'
        return renderError()
      }

      signIn(context, link.viewer.id)
      setFlash(context, { message: `Selamat datang kembali, ${link.viewer.name}.` })
      return redirect(redirectTo, 303)
    },
  },
})
