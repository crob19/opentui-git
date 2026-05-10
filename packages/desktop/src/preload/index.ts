import { contextBridge, ipcRenderer } from "electron";

const ENDPOINT_FLAG = "--opentui-endpoint=";

const endpointArg = process.argv.find((a) => a.startsWith(ENDPOINT_FLAG));
const endpoint = endpointArg ? endpointArg.slice(ENDPOINT_FLAG.length) : null;

type StartResult = { ok: true } | { ok: false; error: string };

const terminal = {
  start(opts: { id: string; cols: number; rows: number }) {
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

contextBridge.exposeInMainWorld("opentui", { endpoint, terminal });
