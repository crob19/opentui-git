# TODO - Phase 2 Features

This document tracks upcoming features and improvements for opentui-git.

## High Priority

### Commit Functionality
- [ ] Commit dialog/modal that appears when pressing 'c'
- [ ] Multi-line commit message input
- [ ] Validate commit message (non-empty)
- [ ] Show staged files in commit preview
- [ ] Amend last commit option

### Branch Operations
- [ ] Branch switching dialog (press 'b')
- [ ] List all local branches
- [ ] List remote branches
- [ ] Create new branch
- [ ] Delete branch (with confirmation)
- [ ] Rename branch
- [ ] Show branch tracking information

### Diff Viewer
- [ ] View diff of selected file (press 'd')
- [ ] Syntax highlighting for diffs
- [ ] Side-by-side diff view option
- [ ] Navigate between hunks
- [ ] Stage/unstage individual hunks
- [ ] Scroll through large diffs

### Remote Operations
- [ ] Pull from remote (press 'p')
- [ ] Push to remote (press 'P')
- [ ] Show pull/push progress
- [ ] Fetch from remote
- [ ] Handle merge conflicts during pull
- [ ] Push with force option
- [ ] Set upstream branch

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
- [ ] Show more git status info (ahead/behind details)

## Low Priority

### Advanced Git Operations
- [ ] Rebase interactive
- [ ] Cherry-pick commits
- [ ] Reset (soft/mixed/hard)
- [ ] Revert commits
- [ ] Tag management
- [ ] Submodule support

### Configuration
- [ ] Config file support (~/.config/opentui-git/config.toml)
- [ ] Custom themes
- [ ] Per-repository settings
- [ ] Git config integration
- [ ] Ignore patterns

### Performance
- [ ] Lazy loading for large repositories
- [ ] Virtual scrolling for file lists
- [ ] Cache git status between refreshes
- [ ] Debounce rapid key presses
- [ ] Optimize diff rendering

### User Experience
- [ ] Help screen (press '?')
- [ ] Command palette
- [ ] Undo last git operation
- [ ] Copy file path to clipboard
- [ ] Status bar with more info
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

## Bugs & Issues

- [ ] Test on Windows
- [ ] Test on Linux
- [ ] Handle very large files
- [ ] Handle binary files gracefully
- [ ] Test with various terminal emulators
- [ ] Memory leak testing
- [ ] Performance testing with large repos

## Documentation

- [ ] API documentation
- [ ] Contributing guide
- [ ] Architecture documentation
- [ ] Video demo/tutorial
- [ ] Screenshot gallery
- [ ] Comparison with lazygit
- [ ] Performance benchmarks

---

## Contributing

Want to work on any of these features? Great! Please:

1. Check if there's already an issue for the feature
2. Create an issue if one doesn't exist
3. Comment on the issue to claim it
4. Submit a PR when ready

For major features, please discuss first in an issue before implementing.
