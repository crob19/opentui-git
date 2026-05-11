/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type TerminalStartResult = { ok: true } | { ok: false; error: string };

interface TerminalBridge {
  start(opts: {
    id: string;
    cols: number;
    rows: number;
    cwd?: string;
  }): Promise<TerminalStartResult>;
  write(id: string, data: string): Promise<void>;
  resize(id: string, cols: number, rows: number): Promise<void>;
  kill(id: string): Promise<void>;
  onData(id: string, cb: (data: string) => void): () => void;
  onExit(
    id: string,
    cb: (info: { exitCode: number; signal?: number }) => void,
  ): () => void;
}

interface ProjectInfo {
  readonly id: string;
  readonly path: string;
  readonly name: string;
  readonly endpoint: string;
}

type OpenProjectResult =
  | { ok: true; project: ProjectInfo }
  | { ok: false; error: string };

interface ProjectsBridge {
  readonly initial: ReadonlyArray<ProjectInfo>;
  list(): Promise<ProjectInfo[]>;
  pickDirectory(): Promise<string | null>;
  open(repoPath: string): Promise<OpenProjectResult>;
  close(id: string): Promise<{ ok: true }>;
}

interface OpentuiBridge {
  readonly endpoint: string | null;
  readonly terminal: TerminalBridge;
  readonly projects: ProjectsBridge;
}

interface Window {
  readonly opentui?: OpentuiBridge;
}
