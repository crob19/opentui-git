import { app, BrowserWindow, Menu, dialog, shell, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import { basename, dirname, join, resolve as resolvePath } from "node:path";
import type { ChildProcess } from "node:child_process";

import { spawnGraphQLServer } from "./server.js";
import { buildAppMenu } from "./menu.js";
import { registerPtyIpc, killAllPtys } from "./pty.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

type ProjectRecord = {
  id: string;
  path: string;
  name: string;
  endpoint: string;
  child: ChildProcess;
};

const projects = new Map<string, ProjectRecord>();
let nextProjectId = 1;
let serverPackageDir = "";

function repoCwdFromArgs(): string {
  const i = process.argv.indexOf("--cwd");
  if (i >= 0 && process.argv[i + 1]) {
    return resolvePath(process.argv[i + 1]!);
  }
  return process.cwd();
}

async function openProject(repoPath: string): Promise<ProjectRecord> {
  const resolved = resolvePath(repoPath);
  for (const p of projects.values()) {
    if (p.path === resolved) return p;
  }
  const { url, child } = await spawnGraphQLServer({
    serverPackageDir,
    repoCwd: resolved,
  });
  const id = `project-${nextProjectId++}`;
  const record: ProjectRecord = {
    id,
    path: resolved,
    name: basename(resolved) || resolved,
    endpoint: url,
    child,
  };
  projects.set(id, record);
  child.on("exit", () => {
    projects.delete(id);
  });
  return record;
}

function closeProject(id: string): void {
  const p = projects.get(id);
  if (!p) return;
  projects.delete(id);
  const child = p.child;
  if (child.killed) return;
  child.kill("SIGTERM");
  setTimeout(() => {
    if (!child.killed && child.exitCode === null) child.kill("SIGKILL");
  }, 2_000).unref();
}

function serializeProject(p: ProjectRecord) {
  return { id: p.id, path: p.path, name: p.name, endpoint: p.endpoint };
}

function registerProjectIpc(): void {
  ipcMain.handle("projects:list", () => {
    return Array.from(projects.values()).map(serializeProject);
  });

  ipcMain.handle("projects:pick", async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0]!;
  });

  ipcMain.handle("projects:open", async (_event, repoPath: string) => {
    try {
      const project = await openProject(repoPath);
      return { ok: true as const, project: serializeProject(project) };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  });

  ipcMain.handle("projects:close", (_event, id: string) => {
    closeProject(id);
    return { ok: true as const };
  });
}

function createWindow(): void {
  const initial = Array.from(projects.values()).map(serializeProject);
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: [
        `--opentui-projects=${encodeURIComponent(JSON.stringify(initial))}`,
      ],
    },
  });

  win.on("ready-to-show", () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const devUrl = process.env["ELECTRON_RENDERER_URL"];
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  if (app.isPackaged) {
    dialog.showErrorBox(
      "opentui-git",
      "Packaged builds need OPENTUI_GIT_ENDPOINT support — server bundling for packaged apps is not wired up yet.",
    );
    app.exit(1);
    return;
  }

  // Tied to the monorepo layout: out/main/index.js -> packages/server
  serverPackageDir = resolvePath(__dirname, "..", "..", "..", "server");

  try {
    await openProject(repoCwdFromArgs());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to start GraphQL server:", message);
    dialog.showErrorBox(
      "opentui-git",
      `Failed to start GraphQL server:\n\n${message}`,
    );
    app.exit(1);
    return;
  }

  Menu.setApplicationMenu(buildAppMenu());
  registerPtyIpc(repoCwdFromArgs());
  registerProjectIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  killAllPtys();
  for (const [, p] of projects) {
    const child = p.child;
    if (child.killed) continue;
    child.kill("SIGTERM");
    setTimeout(() => {
      if (!child.killed && child.exitCode === null) child.kill("SIGKILL");
    }, 2_000).unref();
  }
  projects.clear();
});
