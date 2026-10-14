import type { Handle, RemixNode } from 'remix/component'
import { ImportMap } from 'remix/component/server'

import { scriptEntry } from '../assets.ts'

export interface DocumentProps {
  title?: string
  description?: string
  bodyClass?: string
  children?: RemixNode
}

const SITE_NAME = 'AnyamanRasa'
const DEFAULT_DESCRIPTION =
  'Platform penemuan resep yang menganyam hubungan antar masakan, bahan, dan variasi.'

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let { children, title, description = DEFAULT_DESCRIPTION, bodyClass } = handle.props
    let { href, importMap, preloads } = scriptEntry

    return (
      <html lang="id">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content={description} />
          <meta name="theme-color" content="#ffffff" />
          <title>{title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — Setiap Rasa Punya Cerita`}</title>
          <link rel="icon" type="image/png" href="/favicon.png" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Familjen+Grotesk:wght@400;500;600;700&display=swap"
          />
          <link rel="stylesheet" href="/styles.css" />
          <ImportMap value={importMap} />
          {preloads.map((preloadHref) => (
            <link key={preloadHref} rel="modulepreload" href={preloadHref} />
          ))}
          <script type="module" src={href}></script>
        </head>
        <body class={bodyClass}>{children}</body>
      </html>
    )
  }
}
