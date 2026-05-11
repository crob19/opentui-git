# TODO - Phase 2 Features

This document tracks upcoming features and improvements for opentui-git.

## High Priority

### Git State Sync

- [ ] Add server-side repository watchers for `.git/HEAD`, `.git/index`, `.git/refs/**`, `.git/packed-refs`, and working tree changes
- [ ] Debounce watcher events and map them to targeted invalidations: status, current branch, branches, tags, and diff
- [ ] Add GraphQL subscriptions or SSE for repo state changes so clients can refetch only stale slices
- [ ] Keep remote updates explicit or low-frequency; remote branches should update after `git fetch`/pull, not by constant branch polling
- [ ] Add a manual refresh command as a fallback for missed watcher events or unusual Git operations

## Medium Priority

### Visual Git Graph

- [ ] Display commit graph similar to VS Code Git Graph
- [ ] Show branch relationships visually
- [ ] Color-coded branches
- [ ] Interactive commit selection
- [ ] Show commit details on hover/selection
- [ ] Filter by branch
- [ ] Search commits

### Stash Management

- [ ] List stashes
- [ ] Create stash (press 's')
- [ ] Apply stash
- [ ] Pop stash
- [ ] Drop stash
- [ ] Show stash diff

### File Operations

- [ ] Discard changes for selected file
- [ ] Discard all changes (with confirmation)
- [ ] Open file in default editor
- [ ] Show file history
- [ ] Blame view

### Multi-Project Workspaces

- [x] Open multiple projects in one window as top-of-window tabs (per-project Apollo client + selection state, native folder picker via `+` button)
- [ ] Persist open projects + active tab across launches
  - Write `<userData>/projects.json` with `{ recents, lastSession: { paths, activeIndex } }`; hydrate in `app.whenReady` before `createWindow`
  - Atomic writes (`writeFile(tmp) + rename`) and a debounced (~250ms) flush on open/close/activate, plus a final flush on `before-quit`
  - Validate each path with `fs.existsSync` on startup; drop missing entries and surface a toast
  - Cap auto-restored projects (~8) to avoid spawning dozens of GraphQL servers on launch
  - Add `projects:setActive` IPC so the renderer can report the active tab back to main
- [ ] Per-project state (open file tabs, scroll/cursor, terminal buffer) keyed by path hash under `<userData>/workspaceStorage/<hash>/state.json`
  - Mirrors VS Code's layout; lets one project's state be cleared without touching others
- [ ] Separate "currently open" from "recently opened" — feeds a future Recent Projects menu
- [ ] Migrate from JSON to SQLite once state grows (matches Zed's approach; do this when per-project state lands, not before)
- [ ] Drag-to-reorder project tabs
- [ ] Close-project confirmation if there are unsaved/uncommitted changes

### UI Improvements

- [ ] Split view (files + diff side by side)
- [ ] Customizable color scheme
- [ ] Custom key bindings
- [ ] Resizable panels
- [ ] Search/filter files

## Low Priority

### Advanced Git Operations

- [ ] Rebase interactive
- [ ] Cherry-pick commits
- [ ] Reset (soft/mixed/hard)
- [ ] Revert commits
- [ ] Submodule support

### Configuration

- [ ] Config file support (~/.config/opentui-git/config.toml)
- [ ] Custom themes
- [ ] Per-repository settings
- [ ] Git config integration
- [ ] Ignore patterns

### Performance

- [ ] Lazy loading for large repositories
- [x] Virtual scrolling for file lists - **COMPLETED** - Already implemented
- [ ] Cache git status between refreshes
- [ ] Debounce rapid key presses
- [ ] Optimize diff rendering

### User Experience

- [x] Help screen (press '?') - **COMPLETED** - Shows all keyboard shortcuts with virtual scrolling
- [ ] Command palette
- [ ] Undo last git operation
- [ ] Copy file path to clipboard
- [ ] Loading spinners
- [ ] Better error messages with suggestions

### Terminal Lifecycle Hardening

- [ ] Replace the `let cancelled` + `initStartedRef`/`sessionRef` pair with an `AbortController` so async checkpoints abort promptly instead of waiting for the next `await`. (Orphan-PTY leak on the cancelled branch is patched by calling `terminal.kill(id)` directly, but the underlying ref-juggling is still fragile.)
- [ ] Consider moving terminal lifecycle out of React into a module-level manager keyed by tab id; React components attach/detach DOM and subscribe to an already-running session. Matches the data model (PTY outlives any single mount) and removes the strict-mode dance.

### Embedded Terminal (ghostty-web)

- [ ] Add `ghostty-web` (libghostty-vt compiled to WASM) as the terminal renderer
  - Install via `npm install ghostty-web` — drop-in xterm.js-compatible API from Coder
  - Call `await Ghostty.load()` once at app startup (shared singleton) to initialise the WASM module
- [ ] Spawn a PTY in the Electron main process using `@lydell/node-pty` and expose it over IPC
- [ ] Bridge main ↔ renderer: pipe raw bytes from node-pty to `term.write()`, send `term.onData()` keystrokes back via `ipcRenderer.send`
- [ ] Mount the terminal into a `<div>` container with `term.open(containerEl)` and attach `FitAddon` for auto-resize on panel resize events
- [ ] Theme the terminal from the app's existing colour tokens (background, foreground, cursor, selection)
- [ ] Persist and restore terminal buffer across view unmounts using a `SerializeAddon` (see OpenCode's pattern: save `buffer/rows/cols/scrollY/cursor`, rehydrate on remount)
- [ ] Add a keyboard shortcut to toggle the terminal panel (e.g. `` ctrl+` ``)

### Integration

- [ ] GitHub integration (PRs, issues)
- [ ] GitLab integration
- [ ] Git hooks management
- [ ] External diff tool support
- [ ] External merge tool support

## Nice to Have

- [ ] Mouse support
- [ ] Clipboard integration
- [ ] Export current view as image
- [ ] Tutorial/onboarding
- [ ] Keyboard shortcut cheat sheet
- [ ] Multi-repository support (workspace mode)
- [ ] Git LFS support
- [ ] GPG commit signing
- [ ] Bisect support
- [ ] Worktree management

---

## Contributing

Want to work on any of these features? Great! Please:

1. Check if there's already an issue for the feature
2. Create an issue if one doesn't exist
3. Comment on the issue to claim it
4. Submit a PR when ready

For major features, please discuss first in an issue before implementing.
