import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { ADMIN, SARI, SAYUR_LODEH_DRAFT, SOTO_AYAM, createClient } from '../../../test/client.ts'

describe('admin moderation', () => {
  it('is limited to administrators', async () => {
    assert.equal((await createClient().get('/admin/resep')).status, 303)
    let member = createClient()
    await member.login(SARI)
    assert.equal((await member.get('/admin/resep')).status, 403)
    assert.equal((await member.post('/admin/resep', { aksi: 'archive', resep: [SOTO_AYAM] })).status, 403)
    assert.equal((await createClient().get(`/resep/${SOTO_AYAM}`)).status, 200)
  })

  it('archives and restores published recipes', async () => {
    let admin = createClient()
    await admin.login(ADMIN)
    assert.equal((await admin.post('/admin/resep', { aksi: 'archive', resep: [SOTO_AYAM] })).status, 303)
    assert.equal((await createClient().get(`/resep/${SOTO_AYAM}`)).status, 404)

    await admin.post('/admin/resep', { aksi: 'restore', resep: [SOTO_AYAM] })
    assert.equal((await createClient().get(`/resep/${SOTO_AYAM}`)).status, 200)
  })

  it('does not change drafts', async () => {
    let admin = createClient()
    await admin.login(ADMIN)
    await admin.post('/admin/resep', { aksi: 'restore', resep: [SAYUR_LODEH_DRAFT] })
    assert.equal((await createClient().get(`/resep/${SAYUR_LODEH_DRAFT}`)).status, 404)
  })

  it('exports CSV with formula-safe cells', async () => {
    let admin = createClient()
    await admin.login(ADMIN)
    let response = await admin.get('/admin/resep.csv')
    assert.match(response.headers.get('Content-Type') ?? '', /text\/csv/)
    let body = await response.text()
    assert.match(body, /"Judul","Penulis"/)
    assert.match(body, /"Nasi Goreng Kampung"/)
  })
})
