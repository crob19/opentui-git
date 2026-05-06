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

In one terminal, run the GraphQL server:

```sh
bun run dev:server
```

In another, from the repo root:

```sh
npm --workspace @opentui-git/desktop run dev
# or: cd packages/desktop && npm run dev
```

The renderer points at `http://127.0.0.1:4000/` by default. Override with
`VITE_GRAPHQL_ENDPOINT` if you start the server on a different port.

## Build

```sh
npm --workspace @opentui-git/desktop run build
```

Outputs to `out/` (main, preload, renderer). Packaging (electron-builder /
DMG / etc.) is not wired up yet — add when needed.

## Not yet wired

- Auto-spawn of the GraphQL server from the Electron main process. For now,
  start the server manually. When we add auto-spawn, it goes in
  `src/main/index.ts` using `child_process.spawn` and the `{type:"ready",url}`
  line the server emits on stdout.
- Subscriptions / live updates (status currently polls every 2s).
- IPC bridge in `src/preload/index.ts` — add when the renderer needs
  privileged operations.
