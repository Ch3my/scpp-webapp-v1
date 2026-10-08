/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL used until the user overrides it in /config. */
  readonly VITE_DEFAULT_API_PREFIX?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
