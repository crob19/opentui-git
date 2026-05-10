import { ipcMain, BrowserWindow } from "electron";
import os from "node:os";
import type { IPty } from "@lydell/node-pty";

type Session = {
  pty: IPty;
  windowId: number;
};

const sessions = new Map<string, Session>();

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

export function registerPtyIpc(): void {
  ipcMain.handle(
    "pty:start",
    (event, opts: { id: string; cwd: string; cols: number; rows: number }) => {
      // Lazy-load to avoid loading the native binding before app.whenReady.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodePty =
        require("@lydell/node-pty") as typeof import("@lydell/node-pty");

      const existing = sessions.get(opts.id);
      if (existing) return { ok: true };

      const { file, args } = defaultShell();
      const pty = nodePty.spawn(file, args, {
        name: "xterm-256color",
        cols: opts.cols || 80,
        rows: opts.rows || 24,
        cwd: opts.cwd,
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

      return { ok: true };
    },
  );

  ipcMain.handle("pty:write", (_event, id: string, data: string) => {
    sessions.get(id)?.pty.write(data);
  });

  ipcMain.handle(
    "pty:resize",
    (_event, id: string, cols: number, rows: number) => {
      const s = sessions.get(id);
      if (!s) return;
      try {
        s.pty.resize(Math.max(1, cols | 0), Math.max(1, rows | 0));
      } catch {
        // PTY may have exited between debounce and resize.
      }
    },
  );

  ipcMain.handle("pty:kill", (_event, id: string) => {
    const s = sessions.get(id);
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

// Silence unused import warning on platforms that don't use os.
void os;
