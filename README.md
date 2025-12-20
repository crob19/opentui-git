# opentui-git

A lazygit-style terminal UI git client built with Bun, SolidJS, and OpenTUI.

## Features

- 🎨 Beautiful terminal UI with color-coded file statuses
- ⌨️ Vim-style keyboard navigation (j/k or arrow keys)
- 🚀 Fast and responsive using Bun runtime
- 📦 Single-process application with reactive state management
- 🎯 Simple and intuitive git operations

## Tech Stack

- **[Bun](https://bun.sh)** - Fast JavaScript runtime
- **[SolidJS](https://www.solidjs.com/)** - Reactive UI framework
- **[OpenTUI](https://github.com/sst/opentui)** - Terminal UI library
- **[simple-git](https://github.com/steveukx/git-js)** - Git command wrapper

## Installation

### Prerequisites

- [Bun](https://bun.sh) v1.3.5 or later
- Git installed on your system

### Install Dependencies

```bash
bun install
```

## Usage

### Run in Development Mode

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
