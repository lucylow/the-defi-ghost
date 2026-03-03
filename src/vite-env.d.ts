/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL (e.g. https://api.example.com). Empty = same origin /api (dev proxy or Lovable backend). */
  readonly VITE_API_BASE?: string;
  /** Vite base path for deployment (e.g. /app/). Used by Lovable when app is served from a subpath. */
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
