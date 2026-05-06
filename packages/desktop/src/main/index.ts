import { app, BrowserWindow, dialog, shell } from "electron";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve as resolvePath } from "node:path";
import type { ChildProcess } from "node:child_process";

import { spawnGraphQLServer } from "./server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let serverChild: ChildProcess | null = null;

function repoCwdFromArgs(): string {
  const i = process.argv.indexOf("--cwd");
  if (i >= 0 && process.argv[i + 1]) {
    return resolvePath(process.argv[i + 1]!);
  }
  return process.cwd();
}

async function resolveEndpoint(): Promise<string> {
  const override = process.env["OPENTUI_GIT_ENDPOINT"];
  if (override) return override;

  if (app.isPackaged) {
    throw new Error(
      "Packaged builds need OPENTUI_GIT_ENDPOINT set — server bundling for " +
        "packaged apps is not wired up yet (would require shipping the Bun " +
        "runtime or a `bun build --compile` binary).",
    );
  }

  // Dev: packages/desktop/out/main/index.js → repo root → packages/server.
  const serverPackageDir = resolvePath(app.getAppPath(), "..", "server");
  const { url, child } = await spawnGraphQLServer({
    serverPackageDir,
    repoCwd: repoCwdFromArgs(),
  });
  serverChild = child;

  child.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(
        `[server] exited unexpectedly code=${code} signal=${signal}`,
      );
    }
    serverChild = null;
  });

  return url;
}

function createWindow(endpoint: string): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: [`--opentui-endpoint=${endpoint}`],
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
  let endpoint: string;
  try {
    endpoint = await resolveEndpoint();
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

  createWindow(endpoint);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(endpoint);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverChild && !serverChild.killed) {
    serverChild.kill("SIGTERM");
  }
});
