import { redirect } from 'remix/response/redirect'
import { createController } from 'remix/router'

import { isProvidedFile, storeImage, uploadErrorMessage } from '../../../data/media.ts'
import { findProfileById, isUsernameTaken, updateProfile } from '../../../data/users.ts'
import { type FieldErrors, text, validateUsername } from '../../../domain/validation.ts'
import { routes } from '../../../routes.ts'
import { getShell, notFound, requireViewer, setFlash } from '../../shell.tsx'
import { ProfileEditPage } from '../pages.tsx'

type ProfileField = 'name' | 'username' | 'bio' | 'location' | 'avatar'

export default createController(routes.profile.edit, {
  actions: {
    async index(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let profile = await findProfileById(context.db, viewer.id)
      if (!profile) return notFound(context)
      return context.render(<ProfileEditPage shell={getShell(context)} profile={profile} />)
    },

    async action(context) {
      let viewer = requireViewer(context)
      if (viewer instanceof Response) return viewer
      let profile = await findProfileById(context.db, viewer.id)
      if (!profile) return notFound(context)

      let form = context.formData
      let values = {
        name: text(form.get('name')),
        username: text(form.get('username')).toLowerCase(),
        bio: text(form.get('bio')),
        location: text(form.get('location')),
      }
      let errors: FieldErrors<ProfileField> = {}
      if (!values.name) errors.name = 'Nama wajib diisi.'
      else if (values.name.length > 100) errors.name = 'Nama maksimal 100 karakter.'
      let usernameError = validateUsername(values.username)
      if (usernameError) errors.username = usernameError
      else if (values.username !== profile.username && (await isUsernameTaken(context.db, values.username))) {
        errors.username = 'Nama pengguna sudah dipakai.'
      }
      if (values.bio.length > 280) errors.bio = 'Bio maksimal 280 karakter.'
      if (values.location.length > 100) errors.location = 'Lokasi maksimal 100 karakter.'

      let avatarUrl: string | null | undefined
      let avatar = form.get('avatar')
      if (form.get('hapus_avatar') === '1') avatarUrl = null
      if (Object.keys(errors).length === 0 && isProvidedFile(avatar)) {
        let stored = await storeImage(avatar)
        if (stored.ok) avatarUrl = stored.url
        else errors.avatar = uploadErrorMessage(stored.error)
      }

      if (Object.keys(errors).length > 0) {
        return context.render(
          <ProfileEditPage shell={getShell(context)} profile={{ ...profile, ...values }} errors={errors} />,
          { status: 400 },
        )
      }

      await updateProfile(context.db, viewer.id, { ...values, avatarUrl })
      setFlash(context, { message: 'Profil diperbarui.' })
      return redirect(routes.profile.show.href({ username: values.username }), 303)
    },
  },
})
