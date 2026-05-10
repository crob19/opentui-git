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
