/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface TerminalBridge {
  start(opts: {
    id: string;
    cwd: string;
    cols: number;
    rows: number;
  }): Promise<{ ok: true }>;
  write(id: string, data: string): Promise<void>;
  resize(id: string, cols: number, rows: number): Promise<void>;
  kill(id: string): Promise<void>;
  onData(id: string, cb: (data: string) => void): () => void;
  onExit(
    id: string,
    cb: (info: { exitCode: number; signal?: number }) => void,
  ): () => void;
}

interface OpentuiBridge {
  readonly endpoint: string | null;
  readonly cwd: string | null;
  readonly terminal: TerminalBridge;
}

interface Window {
  readonly opentui?: OpentuiBridge;
}
