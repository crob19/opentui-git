import { contextBridge, ipcRenderer } from "electron";

const PROJECTS_FLAG = "--opentui-projects=";

export type ProjectInfo = {
  id: string;
  path: string;
  name: string;
  endpoint: string;
};

const projectsArg = process.argv.find((a) => a.startsWith(PROJECTS_FLAG));
let initialProjects: ProjectInfo[] = [];
if (projectsArg) {
  try {
    initialProjects = JSON.parse(
      decodeURIComponent(projectsArg.slice(PROJECTS_FLAG.length)),
    );
  } catch {
    initialProjects = [];
  }
}

// Endpoint of the first project — kept for backward compatibility with any
// callers that read `window.opentui.endpoint`.
const endpoint = initialProjects[0]?.endpoint ?? null;

type StartResult = { ok: true } | { ok: false; error: string };

const terminal = {
  start(opts: { id: string; cols: number; rows: number; cwd?: string }) {
    return ipcRenderer.invoke("pty:start", opts) as Promise<StartResult>;
  },
  write(id: string, data: string) {
    return ipcRenderer.invoke("pty:write", id, data);
  },
  resize(id: string, cols: number, rows: number) {
    return ipcRenderer.invoke("pty:resize", id, cols, rows);
  },
  kill(id: string) {
    return ipcRenderer.invoke("pty:kill", id);
  },
  onData(id: string, cb: (data: string) => void) {
    const channel = `pty:data:${id}`;
    const listener = (_e: unknown, data: string) => cb(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  onExit(
    id: string,
    cb: (info: { exitCode: number; signal?: number }) => void,
  ) {
    const channel = `pty:exit:${id}`;
    const listener = (
      _e: unknown,
      info: { exitCode: number; signal?: number },
    ) => cb(info);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
};

type OpenResult =
  | { ok: true; project: ProjectInfo }
  | { ok: false; error: string };

const projects = {
  initial: initialProjects,
  list(): Promise<ProjectInfo[]> {
    return ipcRenderer.invoke("projects:list");
  },
  pickDirectory(): Promise<string | null> {
    return ipcRenderer.invoke("projects:pick");
  },
  open(repoPath: string): Promise<OpenResult> {
    return ipcRenderer.invoke("projects:open", repoPath);
  },
  close(id: string): Promise<{ ok: true }> {
    return ipcRenderer.invoke("projects:close", id);
  },
};

contextBridge.exposeInMainWorld("opentui", { endpoint, terminal, projects });
