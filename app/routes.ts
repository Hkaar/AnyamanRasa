import { form, get, post, route } from 'remix/routes'

export const routes = route({
  assets: get('/assets/*path'),
  media: get('/media/*file'),
  home: get('/'),
  recipes: {
    index: get('/resep'),
    show: get('/resep/:id'),
    save: post('/resep/:id/simpan'),
    create: form('/resep/baru'),
    edit: form('/resep/:id/ubah'),
    variation: form('/resep/:id/variasi'),
  },
  ingredients: {
    show: get('/bahan/:id'),
    search: get('/api/bahan'),
    addToPantry: post('/bahan/:id/dapur'),
  },
  pantry: {
    index: get('/cari-bahan'),
    save: post('/cari-bahan/dapur'),
  },
  graph: {
    index: get('/graf'),
    data: get('/api/graf'),
    search: get('/api/graf/cari'),
  },
  auth: {
    login: form('/masuk'),
    register: form('/daftar'),
    logout: post('/keluar'),
    google: post('/masuk/google'),
    googleCallback: get('/masuk/google/callback'),
    usernameCheck: get('/api/nama-pengguna'),
  },
  profile: {
    show: get('/u/:username'),
    edit: form('/profil/ubah'),
  },
  admin: {
    recipes: form('/admin/resep'),
    exportCsv: get('/admin/resep.csv'),
  },
})
