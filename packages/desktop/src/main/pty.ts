import { ipcMain, BrowserWindow } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import type { IPty } from "@lydell/node-pty";

type Session = {
  pty: IPty;
  windowId: number;
};

const sessions = new Map<string, Session>();
const MAX_SESSIONS = 8;

function ownedSession(
  event: IpcMainInvokeEvent,
  id: string,
): Session | undefined {
  const s = sessions.get(id);
  if (!s) return undefined;
  if (s.windowId !== event.sender.id) return undefined;
  return s;
}

function defaultShell(): { file: string; args: string[] } {
  if (process.platform === "win32") {
    return { file: process.env["COMSPEC"] ?? "powershell.exe", args: [] };
  }
  const file =
    process.env["SHELL"] ??
    (process.platform === "darwin" ? "/bin/zsh" : "/bin/bash");
  // Login shell so .zprofile/.profile load and PATH is populated.
  return { file, args: ["-l"] };
}

export function registerPtyIpc(repoCwd: string): void {
  ipcMain.handle(
    "pty:start",
    (event, opts: { id: string; cols: number; rows: number }) => {
      // Lazy-load to avoid loading the native binding before app.whenReady.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodePty =
        require("@lydell/node-pty") as typeof import("@lydell/node-pty");

      const existing = sessions.get(opts.id);
      if (existing) {
        if (existing.windowId !== event.sender.id) {
          return { ok: false as const, error: "id-in-use" };
        }
        return { ok: true as const };
      }

      if (sessions.size >= MAX_SESSIONS) {
        return { ok: false as const, error: "session-limit" };
      }

      const { file, args } = defaultShell();
      const pty = nodePty.spawn(file, args, {
        name: "xterm-256color",
        cols: opts.cols || 80,
        rows: opts.rows || 24,
        cwd: repoCwd,
        env: { ...process.env, TERM: "xterm-256color" } as Record<
          string,
          string
        >,
      });

      const windowId = event.sender.id;
      sessions.set(opts.id, { pty, windowId });

      pty.onData((data) => {
        const win = BrowserWindow.fromId(windowId);
        if (!win || win.isDestroyed()) return;
        win.webContents.send(`pty:data:${opts.id}`, data);
      });

      pty.onExit(({ exitCode, signal }) => {
        const win = BrowserWindow.fromId(windowId);
        if (win && !win.isDestroyed()) {
          win.webContents.send(`pty:exit:${opts.id}`, { exitCode, signal });
        }
        sessions.delete(opts.id);
      });

      return { ok: true as const };
    },
  );

  ipcMain.handle("pty:write", (event, id: string, data: string) => {
    ownedSession(event, id)?.pty.write(data);
  });

  ipcMain.handle(
    "pty:resize",
    (event, id: string, cols: number, rows: number) => {
      const s = ownedSession(event, id);
      if (!s) return;
      try {
        s.pty.resize(Math.max(1, cols | 0), Math.max(1, rows | 0));
      } catch {
        // PTY may have exited between debounce and resize.
      }
    },
  );

  ipcMain.handle("pty:kill", (event, id: string) => {
    const s = ownedSession(event, id);
    if (!s) return;
    try {
      s.pty.kill();
    } catch {
      /* already gone */
    }
    sessions.delete(id);
  });
}

export function killAllPtys(): void {
  for (const [, s] of sessions) {
    try {
      s.pty.kill();
    } catch {
      /* */
    }
  }
  sessions.clear();
}
