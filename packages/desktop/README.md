# @opentui-git/desktop

Electron + React desktop client for opentui-git. Talks to the GraphQL server
in `packages/server` over HTTP using the shared `@opentui-git/client` Apollo
layer (same generated documents as the TUI).

## Runtime split

- **Server / TUI / shared client**: Bun.
- **Electron main + preload**: Node (Electron's embedded runtime — Bun cannot
  host Electron).
- **Renderer**: React + Vite, bundled JS, runtime-agnostic.

## Develop

```sh
pnpm run dev:desktop
```

That's it — the Electron main process spawns the GraphQL server itself
(`bun run packages/server/src/index.ts` with `PORT=0`), parses the
`{type:"ready",url}` line, and forwards the URL into the renderer via
preload (`window.opentui.endpoint`). The server is killed on app quit.

To point the desktop client at a server you're already running (e.g. one
started in another terminal for log visibility), set `OPENTUI_GIT_ENDPOINT`
— auto-spawn is skipped:

```sh
OPENTUI_GIT_ENDPOINT=http://127.0.0.1:4000/ pnpm run dev:desktop
```

To target a repo other than the desktop package's cwd, pass `--cwd` after
the Electron args (electron-vite forwards them to the main process).

## Build

```sh
pnpm run build:desktop
```

Outputs to `out/{main,preload,renderer}`.

## Packaged builds

`app.isPackaged === true` disables auto-spawn and requires
`OPENTUI_GIT_ENDPOINT`. To make packaged builds self-contained we'd need to
either bundle the Bun runtime alongside Electron or compile the server with
`bun build --compile` and ship that binary. Not wired up yet.

## Not yet wired

- electron-builder / DMG packaging.
- Subscriptions — status currently polls every 2s.
- Mutations beyond `commit` (defined in the schema, not yet surfaced in UI).
