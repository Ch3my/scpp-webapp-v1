/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * Build-time constant from vite.config.ts. Busts the persisted query cache on
 * every deploy, so an update never hydrates data shaped like the previous wire
 * format.
 */
declare const __BUILD_ID__: string

interface ImportMetaEnv {
  /** Base URL used until the user overrides it in /config. */
  readonly VITE_DEFAULT_API_PREFIX?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
