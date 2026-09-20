/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute URL of the Ask Siraj endpoint. Required when the site and the
   *  function live on different hosts, which is the case on GitHub Pages. */
  readonly VITE_CHAT_ENDPOINT?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv & { readonly BASE_URL: string }
}
