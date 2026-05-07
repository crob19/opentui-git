# opentui-git

A lazygit-style terminal UI git client built with [OpenTUI](https://github.com/sst/opentui), SolidJS, and Bun.

## Tech Stack

- **[OpenTUI](https://github.com/sst/opentui)** — Terminal UI library (renders via Bun FFI to a native Zig core)
- **[SolidJS](https://www.solidjs.com/)** — Reactive UI framework
- **[Bun](https://bun.sh)** — JavaScript runtime (required at runtime, see below)
- **[simple-git](https://github.com/steveukx/git-js)** — Git command wrapper

## Installation

### Prerequisites

`opentui-git` runs under the [Bun](https://bun.sh) runtime — OpenTUI's native renderer is loaded via `bun:ffi`, which has no Node equivalent. Install Bun first:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Install via npm / pnpm

```bash
npm install -g opentui-git
# or
pnpm add -g opentui-git
```

Or run on demand without installing globally:

```bash
npx opentui-git
# or
pnpm dlx opentui-git
```

If Bun isn't on your PATH, the launcher will print a clear error pointing you at the install command above.

## Usage

Run inside any git repository:

```bash
opentui-git
```

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.3.5 or later (runtime for the TUI/server)
- [Node](https://nodejs.org) v20+ with [Corepack](https://nodejs.org/api/corepack.html) enabled (for `pnpm`)
- Git

The repo uses **pnpm** as its package manager (pinned via `packageManager` in the root `package.json`); Corepack will activate the right version automatically.

### Install

```bash
pnpm install
```

### Run

```bash
pnpm dev:tui      # TUI in current cwd (use --cwd to point elsewhere)
pnpm dev:server   # Standalone GraphQL server (auto-started by the TUI; useful for log visibility)
pnpm dev:desktop  # Electron desktop client
```

### Typecheck

```bash
pnpm typecheck
```

### Releasing

```bash
pnpm release:patch   # 0.1.0 → 0.1.1
pnpm release:minor   # 0.1.0 → 0.2.0
pnpm release:major   # 0.1.0 → 1.0.0
```

The `release:*` scripts bump `packages/core/package.json`, commit, tag, and push. The `Release` GitHub Actions workflow takes over from the tag push and publishes to npm.

## Project Structure

```
opentui-git/
├── packages/
│   ├── core/        Published as the `opentui-git` npm package — TUI source
│   │                + Node bin launcher that re-execs under Bun.
│   ├── server/      GraphQL backend (private workspace package, vendored
│   │                into core/ at publish time).
│   ├── client/      Shared Apollo client + generated GraphQL documents.
│   └── desktop/     Electron + React desktop client.
└── bunfig.toml      Registers @opentui/solid's JSX preload for the Bun runtime.
```

## Why Bun is required

OpenTUI's native renderer is loaded with `import { dlopen } from "bun:ffi"`. There's no Node-compatible export, so the TUI process must run under Bun. The npm package ships a small Node-runnable bin (`bin/opentui-git.mjs`) that locates `bun` on PATH and re-execs the TS entry point — this is what makes `npx opentui-git` work even though the TUI itself is Bun-only. The GraphQL server and desktop client run on whichever runtime they're invoked from (Bun for the TUI's child server, Node for Electron).

## Logs

OpenTUI includes a built-in console overlay:

- `Ctrl+\` — toggle the overlay
- arrow keys — scroll
- `+` / `-` — resize

All `console.{log,error,warn}` output is redirected there.

## Contributing

Contributions are welcome — issues and PRs both fine.

## License

MIT — see [LICENSE](./LICENSE).

## Credits

Inspired by [lazygit](https://github.com/jesseduffield/lazygit). Built on [OpenTUI](https://github.com/sst/opentui), [SolidJS](https://www.solidjs.com/), and [simple-git](https://github.com/steveukx/git-js).
