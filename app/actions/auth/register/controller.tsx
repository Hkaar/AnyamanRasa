import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import { authErrorMessage, getAuthProvider } from '../../../data/auth-provider.ts'
import { createUser, isEmailTaken, isUsernameTaken } from '../../../data/users.ts'
import { text, validateConsent, validateRegistration } from '../../../domain/validation.ts'
import { routes } from '../../../routes.ts'
import { getShell, setFlash } from '../../shell.tsx'
import { CheckEmailPage, ConsentPage, RegisterPage } from '../pages.tsx'
import { publicUrl, signIn } from '../sign-in.ts'

export default createController(routes.auth.register, {
  actions: {
    index(context) {
      if (context.viewer) return redirect(routes.home.href(), 303)
      let step = context.url.searchParams.get('cara') === 'email' ? ('email' as const) : ('methods' as const)
      return context.render(<RegisterPage shell={getShell(context)} step={step} />)
    },

    async action(context) {
      let result = validateRegistration(context.formData)
      let values = {
        username: text(context.formData.get('username')).toLowerCase(),
        email: text(context.formData.get('email')).toLowerCase(),
      }
      let errors: { username?: string; email?: string; password?: string; confirm?: string; form?: string } =
        result.ok ? {} : { ...result.errors }

      if (result.ok) {
        let [usernameTaken, emailTaken] = await Promise.all([
          isUsernameTaken(context.db, result.value.username),
          isEmailTaken(context.db, result.value.email),
        ])
        if (usernameTaken) errors.username = 'Nama pengguna sudah dipakai.'
        if (emailTaken) errors.email = authErrorMessage('email-taken')
      }
      let renderError = () =>
        context.render(<RegisterPage shell={getShell(context)} step="email" values={values} errors={errors} />, { status: 400 })
      if (!result.ok || Object.keys(errors).length > 0) return renderError()

      // Step 2 of 2 (pen.dev 10d): the account is only created once the terms are accepted. The
      // checked form values ride along as hidden fields; "Kembali" returns to the filled-in form.
      let step = context.formData.get('langkah')
      if (step === 'data') return context.render(<RegisterPage shell={getShell(context)} step="email" values={values} />)
      let account = result.value
      if (step !== 'ketentuan') return context.render(<ConsentPage shell={getShell(context)} account={account} />)
      let consentError = validateConsent(context.formData)
      if (consentError) {
        return context.render(<ConsentPage shell={getShell(context)} account={account} error={consentError} />, { status: 400 })
      }

      let { username, email, password } = result.value
      let signUp = await getAuthProvider().signUp(email, password, {
        username,
        emailRedirectTo: publicUrl(context, `${routes.auth.login.index.href()}?terkonfirmasi=1`),
      })
      if (!signUp.ok) {
        if (signUp.error === 'email-taken') errors.email = authErrorMessage('email-taken')
        else if (signUp.error === 'weak-password') errors.password = authErrorMessage('weak-password')
        else errors.form = authErrorMessage(signUp.error)
        return renderError()
      }

      // Display name defaults to the username; it can be changed in profile settings.
      let viewer = await createUser(context.db, {
        authUserId: signUp.value.identity.id,
        name: username,
        username,
        email,
      })

      if (signUp.value.needsConfirmation) {
        return context.render(<CheckEmailPage shell={getShell(context)} email={email} />)
      }
      signIn(context, viewer.id)
      setFlash(context, {
        message: 'Akun berhasil dibuat. Lengkapi profilmu kapan saja.',
        action: { label: 'Atur profil', href: routes.profile.edit.index.href() },
      })
      return redirect(routes.home.href(), 303)
    },
  },
})
