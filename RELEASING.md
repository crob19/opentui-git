# Release Process

## TL;DR

```bash
# Bug fixes  (0.1.0 → 0.1.1)
pnpm release:patch

# New features  (0.1.0 → 0.2.0)
pnpm release:minor

# Breaking changes  (0.1.0 → 1.0.0)
pnpm release:major
```

The script bumps `packages/core/package.json`, commits, tags, and pushes. From the tag push, GitHub Actions runs `.github/workflows/release.yml` which publishes to npm and drafts a GitHub Release.

## Prerequisites

- A clean working directory on `main`, up to date with `origin/main`.
- The `NPM_TOKEN` repository secret set to a token with publish rights for `opentui-git`.

## What the bump script does

1. Verifies working directory is clean.
2. Verifies you're on `main` and up to date with `origin/main`.
3. Bumps `version` in `packages/core/package.json`.
4. Creates a `chore: release vX.Y.Z` commit.
5. Creates an annotated `vX.Y.Z` tag.
6. Pushes both to `origin`.

## What GitHub Actions does

On any `v*` tag push, `.github/workflows/release.yml`:

1. Sets up Node 22 + pnpm via Corepack.
2. Installs deps with a frozen lockfile.
3. Runs `pnpm -r typecheck`.
4. Publishes `packages/core` to npm (with provenance).
5. Drafts a GitHub Release with auto-generated notes.

## Notes on distribution

The published `opentui-git` npm package contains:

- `bin/opentui-git.mjs` — Node launcher that re-execs the TUI under Bun.
- `src/` — TUI TypeScript source (Bun runs TS directly; no bundle step).
- `dist/server-src/` — vendored copy of the GraphQL server source.

End users **need Bun installed** at runtime (the launcher prints install instructions and exits 127 if it isn't on PATH). The npm package itself is Node-installable; `bun:ffi` is only loaded once the TUI process actually starts.

## Manual recovery

Delete a bad tag locally and remotely:

```bash
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

If the npm publish step failed but the tag and commit went out, fix the underlying issue and re-run the release workflow from the Actions tab against the existing tag.

## Semver

- **Patch** — Bug fixes, docs, dependency bumps without API changes.
- **Minor** — New features, non-breaking changes.
- **Major** — Breaking changes.
