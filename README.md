# opentui-git

A lazygit-style terminal UI git client built with Bun, SolidJS, and OpenTUI.

## Tech Stack

- **[Bun](https://bun.sh)** - Fast JavaScript runtime
- **[SolidJS](https://www.solidjs.com/)** - Reactive UI framework
- **[OpenTUI](https://github.com/sst/opentui)** - Terminal UI library
- **[simple-git](https://github.com/steveukx/git-js)** - Git command wrapper

## Installation

### For Users

#### Homebrew (macOS) - Recommended

```bash
brew tap crob19/tap
brew install opentui-git
```

**Upgrade:**
```bash
brew update
brew upgrade opentui-git
```

#### Direct Download

Check the [releases page](https://github.com/crob19/opentui-git/releases/latest) for the latest version number, then download:

**Intel Mac:**
```bash
# Replace VERSION with the latest version (e.g., 0.1.1)
curl -L https://github.com/crob19/opentui-git/releases/latest/download/opentui-git-vVERSION-darwin-x64.tar.gz | tar xz
sudo mv opentui-git-darwin-x64 /usr/local/bin/opentui-git
```

**Apple Silicon (M1/M2/M3/M4):**
```bash
# Replace VERSION with the latest version (e.g., 0.1.1)
curl -L https://github.com/crob19/opentui-git/releases/latest/download/opentui-git-vVERSION-darwin-arm64.tar.gz | tar xz
sudo mv opentui-git-darwin-arm64 /usr/local/bin/opentui-git
```

### For Development

#### Prerequisites

- [Bun](https://bun.sh) v1.3.5 or later
- Git installed on your system

#### Install Dependencies

```bash
bun install
```

## Usage

Run in any git repository:

```bash
opentui-git
```

### Development Mode

Navigate to a git repository and run:

```bash
bun run dev
```

Or run from any directory:

```bash
cd /path/to/your/git/repo
bun run /path/to/opentui-git/src/index.tsx
```

### Build

```bash
bun run build
```

### Viewing Logs

OpenTUI includes a built-in console overlay for viewing logs:

- **Toggle Console**: Press `Ctrl+\` to open/close the console overlay
- **Scroll Logs**: Use arrow keys when console is focused
- **Resize Console**: Press `+` or `-` to adjust console size
- All `console.log()`, `console.error()`, and `console.warn()` calls appear in the overlay

The console is useful for debugging git operations and viewing error messages without disrupting the TUI.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` or `k` | Move selection up |
| `↓` or `j` | Move selection down |
| `Space` | Stage/unstage selected file |
| `a` | Stage all files |
| `u` | Unstage all files |
| `r` | Refresh status |
| `q` | Quit |
| `Ctrl+C` | Force quit |

## File Status Colors

- 🟢 **Green** - Added/staged files
- 🟡 **Yellow** - Modified files
- 🔴 **Red** - Deleted files
- ⚪ **Gray** - Untracked files
- 🔵 **Blue** - Renamed/copied files
- 🟣 **Magenta** - Conflicted files

## Project Structure

```
opentui-git/
├── src/
│   ├── index.tsx              # Entry point
│   ├── app.tsx                # Main application component
│   ├── git-service.ts         # Git operations wrapper
│   ├── types.ts               # TypeScript types
│   └── components/
│       ├── header.tsx         # Branch/status header
│       ├── file-list.tsx      # File list with colors
│       └── footer.tsx         # Keyboard shortcuts help
├── package.json
├── bunfig.toml                # Bun configuration
├── tsconfig.json              # TypeScript configuration
└── README.md
```

## Phase 1 Features (Current)

✅ Display git status with colored file list  
✅ Keyboard navigation (j/k or arrow keys)  
✅ Stage/unstage individual files (space)  
✅ Stage all files (a)  
✅ Unstage all files (u)  
✅ Current branch display  
✅ File count and sync status  
✅ Quit functionality (q)  
✅ Error handling for non-git directories  

## Phase 2 Features (Planned)

See [TODO.md](./TODO.md) for upcoming features including:
- Commit dialog
- Branch switching
- Diff viewer
- Pull/push operations
- Visual git graph (like VS Code Git Graph)
- And more!

## Development

### Releasing New Versions

The project uses a Makefile for standardized releases:

```bash
# Patch release (0.1.0 → 0.1.1) - Bug fixes
make release-patch

# Minor release (0.1.0 → 0.2.0) - New features
make release-minor

# Major release (0.1.0 → 1.0.0) - Breaking changes
make release-major
```

The release script will:
1. ✅ Verify working directory is clean
2. ✅ Confirm you're on the main branch
3. ✅ Check remote is up to date
4. ✅ Bump version in `package.json`
5. ✅ Create a conventional commit (`chore: release vX.Y.Z`)
6. ✅ Create and push a git tag
7. ✅ Trigger GitHub Actions to build and publish

**After release:**
- GitHub Actions builds binaries for both architectures
- Creates a GitHub Release with downloadable tarballs
- Update the Homebrew formula with new SHA256 checksums (see script output)

### TypeScript Configuration

The project uses SolidJS with OpenTUI, requiring specific TypeScript settings:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@opentui/solid"
  }
}
```

### Bun Configuration

The `bunfig.toml` includes the SolidJS preload script:

```toml
preload = ["@opentui/solid/preload"]
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Credits

Inspired by [lazygit](https://github.com/jesseduffield/lazygit) - A simple terminal UI for git commands.

Built with:
- [OpenTUI](https://github.com/sst/opentui) by SST
- [SolidJS](https://www.solidjs.com/)
- [simple-git](https://github.com/steveukx/git-js)
