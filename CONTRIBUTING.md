# Contributing to opentui-git

Thank you for your interest in contributing to opentui-git! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) v1.3.5 or later
- [Git](https://git-scm.com/)
- A terminal emulator that supports 24-bit color

### Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/opentui-git.git
   cd opentui-git
   ```

3. Install dependencies:
   ```bash
   bun install
   ```

4. Run the application:
   ```bash
   bun run dev
   ```

## Project Structure

```
opentui-git/
├── src/
│   ├── index.tsx              # Entry point
│   ├── app.tsx                # Main application component
│   ├── git-service.ts         # Git operations wrapper
│   ├── types.ts               # TypeScript type definitions
│   └── components/            # UI components
│       ├── header.tsx         # Branch/status header
│       ├── file-list.tsx      # File list with colors
│       └── footer.tsx         # Keyboard shortcuts help
├── package.json
├── bunfig.toml                # Bun configuration
├── tsconfig.json              # TypeScript configuration
├── LICENSE                    # MIT license
├── README.md                  # Main documentation
├── TODO.md                    # Upcoming features
└── CONTRIBUTING.md            # This file
```

## Development Workflow

### Running in Development

```bash
bun run dev
```

This runs the application in the current directory. Navigate to a git repository to see it in action.

### Type Checking

```bash
bun run typecheck
```

Always run type checking before submitting a PR to ensure no type errors.

### Building

```bash
bun run build
```

This creates a bundled version in the `dist/` directory.

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### TypeScript Guidelines

- Use strict type checking (already configured)
- Prefer interfaces over types for object shapes
- Avoid `any` - use `unknown` if type is truly unknown
- Use type guards for narrowing types

### Component Guidelines

- Components should be pure functions
- Use SolidJS patterns (signals, resources, etc.)
- Keep component props interfaces clean and well-documented
- Separate concerns - keep business logic in services

## Git Workflow

### Branching

- Create feature branches from `main`
- Use descriptive branch names: `feature/branch-switching`, `fix/color-rendering`, etc.
- Keep branches focused on a single feature or fix

### Commits

- Write clear, concise commit messages
- Use present tense: "Add feature" not "Added feature"
- Reference issues when applicable: "Fix #123: Handle empty repositories"
- Group related changes in a single commit

### Pull Requests

1. Update your fork:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Push to your fork:
   ```bash
   git push origin your-branch-name
   ```

3. Create a pull request with:
   - Clear description of changes
   - Reference to related issues
   - Screenshots for UI changes
   - Test results if applicable

## Testing

Currently, the project uses manual testing. When adding features:

1. Test in a real git repository
2. Test edge cases (empty repos, large repos, etc.)
3. Test keyboard shortcuts
4. Test error handling

## Adding Features

See [TODO.md](./TODO.md) for planned features. Before starting work on a new feature:

1. Check if there's an existing issue
2. Create an issue if one doesn't exist
3. Discuss the approach in the issue
4. Get feedback before implementing

## OpenTUI Integration

### Key Concepts

- **Components**: Use JSX with OpenTUI primitives (`<box>`, `<text>`, etc.)
- **Hooks**: Use `useKeyboard()` for keyboard input
- **Styling**: Use props like `fg`, `backgroundColor`, `borderStyle`, etc.
- **Layout**: OpenTUI uses Yoga (Flexbox) for layout

### Common Patterns

```tsx
import { createSignal } from "solid-js";
import { useKeyboard } from "@opentui/solid";

export function MyComponent() {
  const [value, setValue] = createSignal(0);
  
  useKeyboard((event) => {
    if (event.name === "up") setValue(v => v + 1);
    if (event.name === "down") setValue(v => v - 1);
  });
  
  return (
    <box flexDirection="column">
      <text fg="#00FF00">Value: {value()}</text>
    </box>
  );
}
```

## Git Service

When adding git operations:

1. Add the operation to `GitService` class
2. Add proper TypeScript types
3. Handle errors gracefully
4. Add JSDoc comments
5. Test with various git states

Example:

```typescript
/**
 * Checkout a branch
 * @param branchName - Name of the branch to checkout
 * @throws Error if branch doesn't exist
 */
async checkoutBranch(branchName: string): Promise<void> {
  try {
    await this.git.checkout(branchName);
  } catch (error) {
    throw new Error(`Failed to checkout branch: ${error}`);
  }
}
```

## Debugging

### Console Output

OpenTUI has a built-in console overlay. Use `console.log()` for debugging:

```typescript
console.log("Debug info:", value);
```

Press the console toggle key to view logs in the OpenTUI console overlay.

### Common Issues

- **Component not rendering**: Check if props are reactive (using signals)
- **Keyboard not working**: Ensure `useKeyboard()` is called in a component
- **Layout issues**: Check Flexbox properties (`flexDirection`, `justifyContent`, etc.)
- **Colors not showing**: Ensure terminal supports 24-bit color

## Documentation

When adding features, update:

- **README.md**: If it affects user-facing functionality
- **TODO.md**: Mark completed features, add new ones
- **Code comments**: JSDoc for public APIs
- **This file**: If it changes the development workflow

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Read the [OpenTUI documentation](https://github.com/sst/opentui)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
