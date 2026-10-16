import type { Handle, RemixNode } from 'remix/component'

import { routes } from '../../routes.ts'
import { Breadcrumb } from '../../ui/breadcrumb.tsx'
import { Icon, type IconName } from '../../ui/icon.tsx'
import { SiteLayout } from '../../ui/layout.tsx'
import type { Shell } from '../../ui/shell.ts'
import { cn, pageX } from '../../ui/utils.ts'

export type LegalDoc = 'terms' | 'privacy'

interface Section {
  id: string
  /** Short label in the table of contents. */
  label: string
  title: string
  body: () => RemixNode
}

interface Document {
  title: string
  intro: string
  readTime: string
  summary: string[]
  aside: { icon: IconName; title: string; text: string; link: { label: string; href: string } }
  sections: Section[]
  footnote: string
}

const DOC_LINKS: { doc: LegalDoc; label: string; href: string }[] = [
  { doc: 'terms', label: 'Syarat & Ketentuan', href: routes.legal.terms.href() },
  { doc: 'privacy', label: 'Kebijakan Privasi', href: routes.legal.privacy.href() },
]

/**
 * pen.dev 13a Syarat & Ketentuan and 13b Kebijakan Privasi. Copy follows the design, adapted
 * where it described things the app doesn't have (account deletion in settings, allergy
 * preferences, a "variations allowed" switch, analytics cookies, real payments, a PDF).
 */
export function LegalPage(handle: Handle<{ shell: Shell; doc: LegalDoc }>) {
  return () => {
    let { shell, doc } = handle.props
    let page = doc === 'terms' ? TERMS : PRIVACY
    return (
      <SiteLayout shell={shell} title={page.title} description={page.intro}>
        <div class={cn(pageX, 'flex flex-col gap-10 pt-8 pb-20 lg:gap-16 lg:pt-16 lg:pb-32')}>
          <header class="flex flex-col gap-5">
            <Breadcrumb items={[{ label: 'Bantuan' }, { label: 'Legal' }]} class="[&_span]:font-normal" />
            <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div class="flex max-w-[760px] flex-col gap-4">
                <h1 class="text-[40px] leading-[44px] font-normal tracking-[-0.8px] text-ink lg:text-[60px] lg:leading-[63px] lg:tracking-[-1.2px]">
                  {page.title}
                </h1>
                <p class="text-base leading-[26px] text-muted lg:text-lg lg:leading-[29px]">{page.intro}</p>
              </div>
              <nav aria-label="Dokumen legal" class="flex shrink-0 gap-1 self-start rounded-full bg-subtle p-1 lg:self-auto">
                {DOC_LINKS.map((link) => (
                  <a
                    key={link.doc}
                    href={link.href}
                    aria-current={link.doc === doc ? 'page' : undefined}
                    class={cn(
                      'rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors',
                      link.doc === doc ? 'bg-hover-strong font-medium text-ink' : 'text-muted hover:bg-hover hover:text-ink',
                    )}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <p class="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm text-muted">
              <span class="flex items-center gap-2">
                <Icon name="calendar" size={16} />
                Terakhir diperbarui 15 Oktober 2026
              </span>
              <span class="size-1 rounded-full bg-line-strong" aria-hidden="true" />
              <span class="flex items-center gap-2">
                <Icon name="clock-3" size={16} />
                {page.readTime}
              </span>
            </p>
          </header>

          <div class="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16 xl:gap-28">
            <aside class="flex w-full shrink-0 flex-col gap-7 lg:sticky lg:top-24 lg:w-[264px]">
              <TableOfContents sections={page.sections} />
              <div class="hidden flex-col gap-3 rounded-lg bg-subtle p-5 lg:flex">
                <span class="flex size-9 items-center justify-center rounded-full bg-hover text-ink">
                  <Icon name={page.aside.icon} size={16} />
                </span>
                <div class="flex flex-col gap-1">
                  <p class="text-[15px] font-medium text-ink">{page.aside.title}</p>
                  <p class="text-[13px] leading-5 text-muted">{page.aside.text}</p>
                </div>
                <a href={page.aside.link.href} class="flex items-center gap-1.5 self-start text-sm font-medium text-accent-strong hover:underline">
                  {page.aside.link.label}
                  <Icon name="arrow-up-right" size={14} />
                </a>
              </div>
            </aside>

            <article class="flex min-w-0 max-w-[720px] flex-1 flex-col gap-12 lg:gap-14">
              <section aria-labelledby="ringkasnya" class="flex flex-col gap-5 rounded-lg bg-accent-subtle px-5 py-6 lg:px-8 lg:py-7">
                <div class="flex items-center justify-between gap-3">
                  <h2 id="ringkasnya" class="flex items-center gap-2.5 text-[22px] font-normal tracking-[-0.2px] text-ink">
                    <Icon name="list" size={20} class="text-accent-strong" />
                    Ringkasnya
                  </h2>
                  <p class="text-[13px] text-accent-strong">Bacaan 1 menit</p>
                </div>
                <ul class="flex flex-col gap-3">
                  {page.summary.map((item) => (
                    <li key={item} class="flex gap-3 text-base leading-[26px] text-ink">
                      <Icon name="check" size={16} class="mt-[5px] shrink-0 text-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p class="text-[13px] leading-5 text-muted">
                  Ringkasan ini untuk memudahkan, tetapi yang berlaku adalah isi lengkap di bawah.
                </p>
              </section>

              {page.sections.map((section, index) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-judul`} class="flex scroll-mt-24 flex-col gap-[18px]">
                  <div class="flex flex-col gap-2 pb-1">
                    <p class="text-[13px] font-medium tracking-[1px] text-accent-strong">{number(index)}</p>
                    <h2 id={`${section.id}-judul`} class="text-2xl leading-[30px] font-normal tracking-[-0.4px] text-ink lg:text-[28px] lg:leading-[34px]">
                      {section.title}
                    </h2>
                  </div>
                  {section.body()}
                </section>
              ))}

              <p class="flex items-center gap-2 text-[13px] text-muted">
                <Icon name="rotate-ccw" size={14} />
                {page.footnote}
              </p>
            </article>
          </div>
        </div>
      </SiteLayout>
    )
  }
}

const number = (index: number) => String(index + 1).padStart(2, '0')

/** Collapsible on small screens (above the content), always open beside it on large ones. */
function TableOfContents(handle: Handle<{ sections: Section[] }>) {
  return () => {
    let { sections } = handle.props
    let list = (
      <ol class="flex flex-col gap-0.5">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              class="flex items-center gap-3.5 rounded-sm px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-hover hover:text-ink"
            >
              <span class="text-[13px] font-medium">{number(index)}</span>
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    )
    return (
      <nav aria-label="Daftar isi" class="w-full">
        <details class="group rounded-lg bg-subtle p-2 lg:hidden">
          <summary class="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
            Daftar isi
            <span class="flex items-center gap-2 font-normal text-muted">
              {sections.length} bagian
              <Icon name="chevron-down" size={16} class="transition-transform group-open:rotate-180" />
            </span>
          </summary>
          <div class="pt-1">{list}</div>
        </details>
        <div class="hidden flex-col gap-3 lg:flex">
          <div class="flex items-center justify-between px-3.5">
            <p class="text-[13px] font-medium tracking-[0.4px] text-ink">Daftar isi</p>
            <p class="text-[13px] text-muted">{sections.length} bagian</p>
          </div>
          {list}
        </div>
      </nav>
    )
  }
}

// Body building blocks (pen.dev text styles: 16/27 body, 17 medium subheads, 6px accent bullets).

function P(handle: Handle<{ children?: RemixNode }>) {
  return () => <p class="text-base leading-[27px] text-ink">{handle.props.children}</p>
}

function Bullets(handle: Handle<{ items: RemixNode[] }>) {
  return () => (
    <ul class="flex flex-col gap-2.5 pl-1">
      {handle.props.items.map((item, index) => (
        <li key={index} class="flex gap-3.5 text-base leading-[27px] text-ink">
          <span class="mt-[11px] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Sub(handle: Handle<{ title: string; children?: RemixNode }>) {
  return () => (
    <div class="flex flex-col gap-1.5 pt-2">
      <h3 class="text-[17px] font-medium text-ink">{handle.props.title}</h3>
      <p class="text-base leading-[27px] text-ink">{handle.props.children}</p>
    </div>
  )
}

function Note(handle: Handle<{ icon: IconName; children?: RemixNode }>) {
  return () => (
    <div class="flex gap-3 rounded-md bg-warning-subtle px-5 py-4 text-[15px] leading-6 text-ink">
      <Icon name={handle.props.icon} size={16} class="mt-1 shrink-0 text-warning" />
      <p>{handle.props.children}</p>
    </div>
  )
}

function Contact(handle: Handle<{ rows: [IconName, string, RemixNode][] }>) {
  return () => (
    <dl class="flex flex-col gap-1">
      {handle.props.rows.map(([icon, label, value]) => (
        <div key={label} class="flex flex-col gap-1 rounded-sm bg-subtle px-[18px] py-3.5 sm:flex-row sm:items-center sm:gap-3.5">
          <dt class="flex shrink-0 items-center gap-3.5 text-sm text-muted sm:w-[154px]">
            <Icon name={icon} size={16} class="text-accent-strong" />
            {label}
          </dt>
          <dd class="text-[15px] text-ink sm:flex-1">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Email(handle: Handle<{ address: string }>) {
  return () => (
    <a href={`mailto:${handle.props.address}`} class="text-accent-strong underline-offset-4 hover:underline">
      {handle.props.address}
    </a>
  )
}

const COMPANY: [IconName, string, RemixNode][] = [
  ['house', 'Perusahaan', 'PT Anyaman Rasa Nusantara'],
  ['map-pin', 'Alamat', 'Jl. Prawirotaman No. 12, Mergangsan, Yogyakarta 55153'],
]

const PLANS = [
  { name: 'Dapur Plus', price: 'Rp29.000', note: '1 akun · bisa dibayar tahunan', tone: 'bg-subtle' },
  { name: 'Keluarga', price: 'Rp49.000', note: 'Hingga 5 anggota keluarga', tone: 'bg-lilac' },
  { name: 'Dapur Usaha', price: 'Rp99.000', note: 'Hingga 10 akun staf dapur', tone: 'bg-success-subtle' },
]

const PAYMENT_METHODS: [IconName, string][] = [
  ['qr-code', 'QRIS'],
  ['shopping-basket', 'GoPay'],
  ['shopping-basket', 'OVO'],
  ['shopping-basket', 'DANA'],
  ['file', 'Kartu debit/kredit'],
]

const TERMS: Document = {
  title: 'Syarat & Ketentuan',
  intro:
    'Ketentuan ini mengatur penggunaan aplikasi dan situs AnyamanRasa yang dikelola oleh PT Anyaman Rasa Nusantara. Dengan membuat akun atau memakai layanan kami, kamu menyetujui ketentuan di bawah ini.',
  readTime: '±10 menit baca',
  summary: [
    'Resep yang kamu tulis tetap milikmu. Kami hanya meminta izin untuk menampilkannya di AnyamanRasa.',
    'Orang lain boleh membuat variasi dari resepmu yang sudah terbit, dan namamu selalu dicantumkan.',
    'Langganan Dapur Plus, Keluarga, dan Dapur Usaha masih berupa simulasi: belum ada tagihan sungguhan.',
    'Bersikap baik, jangan menjiplak, dan jangan membagikan klaim kesehatan yang menyesatkan.',
  ],
  aside: {
    icon: 'info',
    title: 'Masih bingung?',
    text: 'Tim kami siap menjelaskan bagian mana pun dengan bahasa yang mudah.',
    link: { label: 'legal@anyamanrasa.id', href: 'mailto:legal@anyamanrasa.id' },
  },
  sections: [
    {
      id: 'akun',
      label: 'Akun',
      title: 'Akun kamu',
      body: () => (
        <>
          <P>
            Untuk menulis resep, menyimpan koleksi, atau berlangganan, kamu perlu membuat akun AnyamanRasa. Kamu bisa
            mendaftar dengan email atau akun Google.
          </P>
          <Bullets
            items={[
              'Kamu minimal berusia 13 tahun. Jika belum berusia 18 tahun, kamu perlu izin orang tua atau wali.',
              'Data yang kamu berikan saat mendaftar harus benar dan diperbarui jika berubah.',
              'Kamu bertanggung jawab menjaga kerahasiaan kata sandi dan semua aktivitas di akunmu.',
              'Satu orang hanya boleh memiliki satu akun pribadi. Akun tidak boleh dijual atau dipindahtangankan.',
            ]}
          />
          <P>
            Jika kamu menduga akunmu diakses orang lain, segera hubungi kami di <Email address="keamanan@anyamanrasa.id" />.
          </P>
        </>
      ),
    },
    {
      id: 'konten',
      label: 'Konten & resep pengguna',
      title: 'Konten & resep pengguna',
      body: () => (
        <>
          <P>
            Resep, variasi, dan foto yang kamu unggah tetap milikmu. Kami hanya membutuhkan izin tertentu agar bisa
            menampilkannya kepada komunitas.
          </P>
          <Sub title="2.1 Lisensi yang kamu berikan">
            Dengan menerbitkan konten, kamu memberi AnyamanRasa lisensi non-eksklusif, bebas royalti, dan berlaku di
            seluruh dunia untuk menyimpan, menampilkan, menyesuaikan format, dan mempromosikan konten tersebut di dalam
            layanan. Lisensi ini berakhir saat konten dihapus dari layanan, kecuali untuk bagian yang sudah menjadi dasar
            variasi pengguna lain.
          </Sub>
          <Sub title="2.2 Variasi resep">
            Setiap resep yang sudah terbit boleh dijadikan dasar variasi oleh pengguna lain, misalnya mengganti santan
            dengan susu oat atau menurunkan tingkat pedas. Pembuat variasi wajib menuliskan apa yang diubah, dan
            variasinya terhubung ke resep aslimu di Graf Resep.
          </Sub>
          <Sub title="2.3 Atribusi">
            Setiap variasi wajib menampilkan nama pembuat resep asli beserta tautannya. Atribusi dibuat otomatis dan
            tidak dapat dihapus oleh pembuat variasi.
          </Sub>
          <Note icon="lightbulb">
            Membagikan resep keluarga atau dari buku masak? Pastikan kamu berhak membagikannya. Daftar bahan tidak
            dilindungi hak cipta, tetapi teks langkah, cerita, dan foto bisa dilindungi.
          </Note>
        </>
      ),
    },
    {
      id: 'langganan',
      label: 'Langganan & pembayaran',
      title: 'Langganan & pembayaran',
      body: () => (
        <>
          <P>Fitur dasar AnyamanRasa gratis. Kami juga menyiapkan tiga paket berlangganan:</P>
          <div class="grid gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} class={cn('flex flex-col gap-1.5 rounded-md px-5 py-[18px]', plan.tone)}>
                <p class="text-sm font-medium text-accent-strong">{plan.name}</p>
                <p class="flex items-end gap-1">
                  <span class="text-[26px] tracking-[-0.4px] text-ink">{plan.price}</span>
                  <span class="pb-1 text-sm text-muted">/bulan</span>
                </p>
                <p class="text-[13px] text-muted">{plan.note}</p>
              </div>
            ))}
          </div>
          <P>Pembayaran akan dapat dilakukan melalui metode berikut. Harga sudah termasuk PPN.</P>
          <ul class="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map(([icon, label]) => (
              <li key={label} class="flex items-center gap-2 rounded-full bg-subtle px-3.5 py-[9px] text-sm text-ink">
                <Icon name={icon} size={14} class="text-muted" />
                {label}
              </li>
            ))}
          </ul>
          <Note icon="info">
            Halaman berlangganan saat ini masih berupa simulasi: tidak ada tagihan sungguhan yang dibuat dan fitur paket
            belum aktif. Ketentuan 3.1–3.3 berlaku saat pembayaran sungguhan dibuka.
          </Note>
          <Sub title="3.1 Perpanjangan otomatis">
            Langganan diperpanjang otomatis setiap bulan atau tahun sesuai paket yang kamu pilih. Kami mengirim pengingat
            3 hari sebelum tagihan berikutnya. Untuk QRIS, kamu perlu memindai kode baru setiap periode karena metode ini
            tidak mendukung debit otomatis.
          </Sub>
          <Sub title="3.2 Pembatalan & pengembalian dana">
            Kamu bisa membatalkan langganan kapan saja lewat Pengaturan › Langganan & tagihan. Akses tetap aktif hingga
            akhir periode yang sudah dibayar. Kami tidak mengembalikan dana untuk periode berjalan, kecuali terjadi
            tagihan ganda atau kesalahan sistem dari pihak kami yang dilaporkan dalam 14 hari.
          </Sub>
          <Sub title="3.3 Perubahan harga">
            Jika harga berubah, kami akan memberi tahu paling lambat 30 hari sebelumnya. Harga baru berlaku mulai periode
            berikutnya, dan kamu bebas berhenti sebelum itu.
          </Sub>
        </>
      ),
    },
    {
      id: 'dilarang',
      label: 'Hal yang dilarang',
      title: 'Hal yang dilarang',
      body: () => (
        <>
          <P>Agar AnyamanRasa tetap jadi dapur yang nyaman untuk semua orang, kamu tidak boleh:</P>
          <Bullets
            items={[
              'Menyalin resep, foto, atau tulisan orang lain tanpa izin lalu mengakuinya sebagai karyamu.',
              'Mengunggah konten yang mengandung ujaran kebencian, SARA, pelecehan, atau kekerasan.',
              'Membagikan klaim kesehatan yang menyesatkan, misalnya resep yang “menyembuhkan” penyakit.',
              'Melakukan spam, promosi terselubung, atau memanipulasi jumlah simpan dan popularitas resep.',
              'Mengambil data secara otomatis (scraping) atau mengganggu sistem dan keamanan layanan.',
            ]}
          />
        </>
      ),
    },
    {
      id: 'penghentian',
      label: 'Penghentian',
      title: 'Penghentian akun',
      body: () => (
        <>
          <P>
            Kamu dapat meminta akunmu dihapus kapan saja dengan mengirim email ke <Email address="legal@anyamanrasa.id" />{' '}
            dari alamat email akunmu. Akun dinonaktifkan setelah permintaan kami verifikasi dan dihapus permanen dalam 30
            hari.
          </P>
          <P>
            Kami dapat menangguhkan akun atau mengarsipkan resep yang melanggar ketentuan ini. Untuk pelanggaran ringan,
            kami memberi peringatan terlebih dahulu. Jika kamu merasa keputusan kami keliru, ajukan banding dalam 14 hari
            melalui email.
          </P>
        </>
      ),
    },
    {
      id: 'tanggung-jawab',
      label: 'Batasan tanggung jawab',
      title: 'Batasan tanggung jawab',
      body: () => (
        <>
          <P>
            Resep di AnyamanRasa ditulis oleh komunitas. Kami berupaya menjaga kualitasnya, tetapi tidak dapat menjamin
            setiap takaran, waktu memasak, atau informasi gizi selalu akurat.
          </P>
          <Bullets
            items={[
              'Selalu periksa daftar bahan dan label kemasan jika kamu atau keluargamu punya alergi. AnyamanRasa tidak memberi penanda alergi.',
              'Perhatikan keamanan pangan, terutama saat mengolah daging, telur, dan makanan laut.',
              'Sejauh diizinkan hukum, tanggung jawab kami terbatas pada jumlah yang kamu bayarkan kepada kami dalam 12 bulan terakhir.',
            ]}
          />
        </>
      ),
    },
    {
      id: 'hukum',
      label: 'Hukum yang berlaku',
      title: 'Hukum yang berlaku',
      body: () => (
        <P>
          Ketentuan ini diatur oleh hukum Negara Republik Indonesia. Kami akan berusaha menyelesaikan setiap perselisihan
          secara musyawarah dalam 30 hari. Jika tidak tercapai kesepakatan, perselisihan diselesaikan melalui Pengadilan
          Negeri Yogyakarta, tanpa mengurangi hakmu sebagai konsumen menurut UU No. 8 Tahun 1999 tentang Perlindungan
          Konsumen.
        </P>
      ),
    },
    {
      id: 'kontak',
      label: 'Kontak',
      title: 'Hubungi kami',
      body: () => (
        <>
          <P>Punya pertanyaan tentang ketentuan ini? Kami biasanya membalas dalam 2 hari kerja.</P>
          <Contact
            rows={[
              ['mail', 'Email', <Email address="legal@anyamanrasa.id" />],
              ...COMPANY,
              ['clock-3', 'Jam layanan', 'Senin–Jumat, 09.00–17.00 WIB'],
            ]}
          />
        </>
      ),
    },
  ],
  footnote: 'Ini versi pertama Syarat & Ketentuan AnyamanRasa. Perubahan akan kami umumkan di halaman ini.',
}

const DATA_ROWS: [string, string, string][] = [
  ['Data akun', 'Nama, nama pengguna, email, foto profil, bio, dan kota', 'Kamu atau Google'],
  ['Kata sandi', 'Dikelola Supabase Auth dalam bentuk hash; kami tidak pernah menyimpannya', 'Kamu'],
  ['Isi dapur', 'Bahan yang kamu simpan di Dapurku, mis. tempe, santan, cabai rawit', 'Kamu'],
  ['Konten', 'Resep, variasi, foto, draf, dan resep yang kamu simpan', 'Kamu'],
  ['Sesi', 'Cookie yang menjaga kamu tetap masuk', 'Otomatis'],
  ['Perangkat', 'Alamat IP dan jenis peramban di log server penyedia hosting', 'Otomatis'],
  ['Pembayaran', 'Tidak ada. Langganan masih simulasi; nomor dan metode bayar tidak disimpan', '—'],
]

const RIGHTS: [IconName, string, string][] = [
  ['eye', 'Mengakses', 'Meminta salinan data yang kami simpan tentangmu.'],
  ['pencil', 'Memperbaiki', 'Mengubah profilmu langsung di Pengaturan, atau meminta kami memperbaiki data lain.'],
  ['trash-2', 'Menghapus', 'Meminta data dihapus saat tidak lagi diperlukan.'],
  ['rotate-ccw', 'Menarik persetujuan', 'Berhenti memakai layanan dan meminta pemrosesan datamu dihentikan.'],
  ['download', 'Memindahkan', 'Menerima datamu dalam format umum seperti JSON atau CSV.'],
  ['shield-check', 'Menolak profiling', 'Kami tidak membuat profil otomatis dari aktivitasmu.'],
]

const PRIVACY: Document = {
  title: 'Kebijakan Privasi',
  intro:
    'Kebijakan ini menjelaskan data apa yang kami kumpulkan, untuk apa, dan bagaimana kamu mengendalikannya. Kami menyusunnya sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).',
  readTime: '±8 menit baca',
  summary: [
    'Kami tidak menjual data pribadimu kepada siapa pun.',
    'Isi dapur yang kamu simpan hanya dipakai untuk mencari resep yang cocok untukmu.',
    'Kamu bisa meminta salinan, perbaikan, atau penghapusan datamu kapan saja sesuai UU PDP.',
    'Kami hanya memakai cookie sesi: tanpa cookie analitik atau iklan.',
  ],
  aside: {
    icon: 'shield',
    title: 'Kelola datamu',
    text: 'Perbarui profilmu di Pengaturan. Untuk salinan atau penghapusan data, kirim email kepada kami.',
    link: { label: 'Buka Pengaturan', href: routes.profile.edit.index.href() },
  },
  sections: [
    {
      id: 'data',
      label: 'Data yang dikumpulkan',
      title: 'Data yang kami kumpulkan',
      body: () => (
        <>
          <P>Kami hanya mengumpulkan data yang dibutuhkan agar AnyamanRasa bekerja dengan baik untukmu.</P>
          <table class="w-full border-separate border-spacing-y-1 text-left">
            <thead class="text-xs font-medium tracking-[0.4px] text-muted uppercase">
              <tr>
                <th scope="col" class="px-4 pb-1 font-medium sm:w-[168px]">Jenis data</th>
                <th scope="col" class="px-4 pb-1 font-medium">Contoh</th>
                <th scope="col" class="hidden px-4 pb-1 font-medium sm:table-cell sm:w-[120px]">Sumber</th>
              </tr>
            </thead>
            <tbody>
              {DATA_ROWS.map(([kind, example, source]) => (
                <tr key={kind} class="bg-subtle align-top text-sm leading-[21px]">
                  <th scope="row" class="rounded-l-sm px-4 py-3 font-medium text-ink">{kind}</th>
                  <td class="px-4 py-3 text-muted max-sm:rounded-r-sm">
                    {example}
                    <span class="block pt-1 text-[13px] sm:hidden">Sumber: {source}</span>
                  </td>
                  <td class="hidden rounded-r-sm px-4 py-3 text-[13px] text-muted sm:table-cell">{source}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note icon="info">
            Kami tidak meminta data kesehatan seperti alergi atau pola makan. Jangan menuliskan data pribadi orang lain di
            resep atau bio publikmu.
          </Note>
        </>
      ),
    },
    {
      id: 'penggunaan',
      label: 'Cara penggunaan data',
      title: 'Cara kami menggunakan data',
      body: () => (
        <>
          <Sub title="2.1 Rekomendasi dari bahan dapur">
            Saat kamu memakai Cari dari Bahan, kami mencocokkan isi dapurmu dengan resep di AnyamanRasa untuk menampilkan
            masakan yang bisa langsung kamu buat, lengkap dengan bahan yang masih kurang. Isi dapurmu tidak pernah
            ditampilkan kepada pengguna lain.
          </Sub>
          <Sub title="2.2 Profil & konten publik">
            Nama, nama pengguna, foto, bio, dan kota, serta resep dan variasi yang sudah terbit, tampil di profil publikmu.
            Draf dan resep yang kamu simpan hanya terlihat olehmu.
          </Sub>
          <Sub title="2.3 Menjalankan & menjaga layanan">
            Kami juga memakai data untuk menjaga akunmu tetap aman, mencegah penyalahgunaan, dan memoderasi konten yang
            melanggar ketentuan. Kami tidak memasang alat analitik atau iklan pihak ketiga.
          </Sub>
        </>
      ),
    },
    {
      id: 'berbagi',
      label: 'Berbagi data',
      title: 'Kapan kami membagikan data',
      body: () => (
        <>
          <P>Kami tidak menjual data pribadimu. Data hanya dibagikan dalam situasi berikut:</P>
          <Bullets
            items={[
              'Penyedia infrastruktur seperti Supabase (autentikasi, database, dan penyimpanan foto) dan layanan hosting, yang terikat perjanjian kerahasiaan dengan kami.',
              'Google, jika kamu memilih masuk dengan akun Google.',
              'Pengguna lain, hanya untuk konten yang kamu jadikan publik seperti resep, variasi, dan profil.',
              'Aparat penegak hukum, jika diwajibkan oleh peraturan perundang-undangan yang berlaku.',
            ]}
          />
          <P>Belum ada mitra pembayaran yang menerima datamu, karena langganan masih berupa simulasi.</P>
        </>
      ),
    },
    {
      id: 'keamanan',
      label: 'Penyimpanan & keamanan',
      title: 'Penyimpanan & keamanan',
      body: () => (
        <>
          <P>
            Data disimpan di server penyedia infrastruktur kami. Semua koneksi memakai enkripsi TLS, kata sandi tidak
            pernah tersimpan dalam bentuk teks biasa, dan akses internal dibatasi hanya untuk tim yang benar-benar
            membutuhkannya.
          </P>
          <P>Data akun disimpan selama akunmu aktif. Setelah kamu meminta penghapusan, data dihapus dalam 30 hari.</P>
          <P>
            Jika terjadi kegagalan pelindungan data, kami akan memberi tahu kamu dan lembaga yang berwenang paling lambat
            3 × 24 jam setelah kejadian diketahui.
          </P>
        </>
      ),
    },
    {
      id: 'hak',
      label: 'Hak pengguna (UU PDP)',
      title: 'Hakmu sebagai pemilik data',
      body: () => (
        <>
          <P>Berdasarkan UU PDP, kamu memiliki hak-hak berikut atas data pribadimu:</P>
          <ul class="grid gap-3 sm:grid-cols-2">
            {RIGHTS.map(([icon, title, text]) => (
              <li key={title} class="flex flex-col gap-3 rounded-md bg-subtle p-5">
                <span class="flex size-9 items-center justify-center rounded-full bg-accent-subtle text-accent-strong">
                  <Icon name={icon} size={16} />
                </span>
                <span class="flex flex-col gap-1">
                  <span class="text-[15px] font-medium text-ink">{title}</span>
                  <span class="text-sm leading-[22px] text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
          <P>
            Profil publikmu bisa kamu ubah langsung di Pengaturan. Untuk permintaan lain, kirim email kepada kami dan kami
            akan menanggapinya paling lambat 3 × 24 jam.
          </P>
        </>
      ),
    },
    {
      id: 'cookie',
      label: 'Cookie',
      title: 'Cookie & teknologi serupa',
      body: () => (
        <>
          <P>Di situs web, kami hanya memakai cookie yang dibutuhkan agar layanan berfungsi.</P>
          <Bullets
            items={[
              'Cookie sesi — wajib agar fitur masuk berfungsi dan formulir terlindung dari permintaan palsu. Berlaku hingga 30 hari.',
              'Tanpa cookie analitik atau iklan — kami tidak melacak kunjunganmu dan tidak memakai cookie pihak ketiga.',
            ]}
          />
          <P>Karena tidak ada cookie opsional, tidak ada pengaturan cookie yang perlu kamu ubah.</P>
        </>
      ),
    },
    {
      id: 'anak',
      label: 'Anak-anak',
      title: 'Privasi anak-anak',
      body: () => (
        <P>
          AnyamanRasa tidak ditujukan untuk anak di bawah 13 tahun. Pengguna berusia 13–17 tahun memerlukan persetujuan
          orang tua atau wali. Jika kami mengetahui ada data anak yang terkumpul tanpa persetujuan tersebut, kami akan
          segera menghapusnya.
        </P>
      ),
    },
    {
      id: 'kontak',
      label: 'Kontak',
      title: 'Hubungi kami',
      body: () => (
        <>
          <P>Untuk pertanyaan atau permintaan terkait data pribadimu, hubungi Pejabat Pelindungan Data Pribadi kami.</P>
          <Contact
            rows={[
              ['mail', 'Email', <Email address="privasi@anyamanrasa.id" />],
              ['user-round', 'Pejabat PDP', 'Rina Hapsari'],
              ...COMPANY,
            ]}
          />
        </>
      ),
    },
  ],
  footnote: 'Ini versi pertama Kebijakan Privasi AnyamanRasa. Perubahan akan kami umumkan di halaman ini.',
}
