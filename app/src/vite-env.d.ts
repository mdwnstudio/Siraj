/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Absolute URL of the Ask Siraj endpoint. Required when the site and the
   *  function live on different hosts, which is the case on GitHub Pages. */
  readonly VITE_CHAT_ENDPOINT?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv & { readonly BASE_URL: string }
}

/** Short commit hash of this build (vite.config.ts). */
declare const __BUILD__: string
