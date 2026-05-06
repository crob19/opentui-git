/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface OpentuiBridge {
  readonly endpoint: string | null;
}

interface Window {
  readonly opentui?: OpentuiBridge;
}
