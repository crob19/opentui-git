# Desktop Parity TODO

Bring `packages/desktop` to feature parity with the TUI (`packages/core/src/tui`).

**Strategy:** lift framework-agnostic logic into `packages/core/src/shared/`, keep Solid views for TUI, write fresh React views for desktop.
**UX direction:** desktop-native (buttons, context menus, Cmd-shortcuts, drag-to-stage), not TUI keybinding parity.
**Already shared:** `packages/client` (Apollo), `packages/server` (GraphQL), `packages/core/src/git` (git service).

---

## Phase 0 — Extract shared logic

Foundation. No user-visible change. TUI must still work after this.

- [x] Create `packages/core/src/shared/` directory + barrel export
- [x] Move `tui/utils/diff-parser.ts` → `shared/diff-parser.ts`, update TUI imports
- [x] Move `tui/utils/syntax-highlighting.ts` → `shared/syntax-highlighting.ts`, update TUI imports
- [x] Move `tui/utils/language-detection.ts` → `shared/language-detection.ts`, update TUI imports
- [x] Move `tui/utils/file-tree.ts` → `shared/file-tree.ts`; desktop now consumes it via `opentui-git/shared/file-tree`, local copy deleted
- [x] Expose new paths via `core` package.json `exports` (`./shared`, `./shared/file-tree`, etc.)
- [ ] Define `CommandAdapter` interface (`{ toast, confirm, refetch }`) — deferred; desktop uses Apollo mutations directly so command-layer share isn't load-bearing yet
- [ ] Refactor TUI commands (branch / file / remote / tag) onto adapter — deferred (see above)
- [x] Smoke-test: TUI typecheck clean, desktop typecheck + build clean

## Phase 1 — Desktop shell + staging + commit (MVP)

First usable version of the desktop app.

### Layout & shell

- [x] Three-region layout: sidebar (branches/tags), main (files + diff), bottom status bar
- [x] Status bar: repo name, current branch, ahead/behind, dirty count
- [x] Electron menubar: App / File / Edit / View / Window / Help
- [x] Wire global keyboard handler (Cmd+Enter for commit; Esc closes modals; Cmd+S TBD with editor)

### File list & staging

- [x] File list component with status icons + colors
- [x] Selection (single + multi with Shift/Cmd-click)
- [x] Stage/unstage via row button
- [x] Stage/unstage via right-click context menu
- [x] Drag-to-stage (drag from "Changes" to "Staged" section)
- [x] "Stage all" / "Unstage all" toolbar buttons
- [x] Live refresh after staging ops (Apollo refetchQueries on Status)

### Commit

- [x] Commit panel below file list: message textarea + Commit button
- [x] Show staged-files preview in commit panel
- [x] Cmd+Enter to commit
- [x] Validate non-empty message; disable button when invalid
- [x] Toast on success / error
- [x] Clear message + refresh after commit

### Primitives

- [x] Toast component + provider (info / success / error)
- [x] Modal/Dialog primitive (in-house, promise-based `useModal().open` / `confirm`)
- [x] Confirm dialog (with destructive variant)
- [x] Error boundary at app root

## Phase 2 — Branches, tags, remote

- [ ] Branch list in sidebar with current marker, ahead/behind
- [ ] Double-click branch → checkout
- [ ] Branch context menu: checkout, create from, rename, delete, merge into current
- [ ] "New branch" button in sidebar
- [ ] Tags section in sidebar
- [ ] Create tag dialog
- [ ] Push tag action
- [ ] Toolbar: Pull, Push, Fetch buttons (with spinner state)
- [ ] Confirm dialog for delete branch / force push

## Phase 3 — Diff viewer + edit mode

- [ ] Diff pane in main area (right of file list, or full-width when file selected)
- [ ] Reuse `shared/diff-parser` + `shared/syntax-highlighting`
- [ ] Unified ↔ side-by-side toggle (segmented control)
- [ ] Mode picker dropdown: Working tree / Staged / Branch compare
- [ ] Per-hunk stage/unstage buttons (desktop-native upgrade vs TUI)
- [ ] Per-line stage/unstage
- [ ] Inline editor (Monaco or CodeMirror — decide bundle-size tradeoff)
- [ ] Cmd+S to save edits

## Phase 4 — Polish

- [ ] Help/shortcuts overlay (Cmd+/)
- [ ] Virtualized file + branch lists
- [ ] Folder tree expand/collapse (persisted)
- [ ] Recent-repos picker on launch
- [ ] Settings window (theme, default remote, editor binary)
- [ ] Native notifications for long ops (push/pull complete)
- [ ] Crash reporter

## Phase 5 — Beyond TUI (optional)

- [ ] Git graph view
- [ ] Stash UI
- [ ] File history / blame
- [ ] Conflict resolution UI

---

## Open decisions

- **Editor:** Monaco vs CodeMirror — Monaco bundles ~5MB, CodeMirror ~1MB. Decide before Phase 3.
- **Live updates:** keep 2s polling or move to GraphQL subscriptions / fs.watch. Polling will feel sluggish for staging — likely revisit during Phase 1.
- **Modal lib:** Radix vs in-house. Lean Radix unless bundle pressure says otherwise.
