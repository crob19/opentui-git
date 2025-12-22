# Release Process

This document describes how to create a new release of opentui-git.

## Quick Start

```bash
# For bug fixes (0.1.0 → 0.1.1)
make release-patch

# For new features (0.1.0 → 0.2.0)
make release-minor

# For breaking changes (0.1.0 → 1.0.0)
make release-major
```

## What Happens

1. **Pre-flight checks:**
   - Verifies git working directory is clean
   - Warns if not on `main` branch (with confirmation)
   - Checks if local branch is up to date with remote

2. **Version bump:**
   - Updates `version` field in `package.json`
   - Commits with message: `chore: release vX.Y.Z`

3. **Git tag:**
   - Creates annotated tag `vX.Y.Z`
   - Pushes both commit and tag to origin

4. **GitHub Actions:**
   - Automatically triggered by the tag push
   - Builds binaries for macOS (ARM64 and x64)
   - Creates a GitHub Release
   - Attaches tarballs to the release

5. **Post-release:**
   - Script outputs commands to calculate SHA256 checksums
   - Use these to update the Homebrew formula

## Updating Homebrew Formula

After the GitHub Release is published:

1. **Calculate SHA256 checksums:**
   ```bash
   curl -sL https://github.com/crob19/opentui-git/releases/download/vX.Y.Z/opentui-git-vX.Y.Z-darwin-arm64.tar.gz | shasum -a 256
   curl -sL https://github.com/crob19/opentui-git/releases/download/vX.Y.Z/opentui-git-vX.Y.Z-darwin-x64.tar.gz | shasum -a 256
   ```

2. **Update `homebrew-tap/Formula/opentui-git.rb`:**
   - Update `version "X.Y.Z"`
   - Update both `url` lines with new version
   - Update both `sha256` values with checksums from step 1
   - Commit and push to `homebrew-tap` repository

3. **Users can upgrade:**
   ```bash
   brew update
   brew upgrade opentui-git
   ```

## Manual Process (if needed)

If you need to release without using the Makefile:

```bash
# 1. Update version in package.json manually
vim package.json

# 2. Commit
git add package.json
git commit -m "chore: release vX.Y.Z"

# 3. Tag
git tag vX.Y.Z

# 4. Push
git push origin main
git push origin vX.Y.Z
```

## Troubleshooting

### "Working directory is not clean"
Commit or stash your changes before releasing:
```bash
git status
git add .
git commit -m "Your changes"
```

### "Not on main branch"
Either switch to main or continue with current branch:
```bash
git checkout main
git pull origin main
```

### Release failed to push
Push manually:
```bash
git push origin main
git push origin vX.Y.Z
```

### Need to delete a tag
If you made a mistake:
```bash
# Delete local tag
git tag -d vX.Y.Z

# Delete remote tag
git push origin :refs/tags/vX.Y.Z
```

## Semantic Versioning Guide

- **Patch (0.0.X)** - Bug fixes, documentation updates
- **Minor (0.X.0)** - New features, non-breaking changes
- **Major (X.0.0)** - Breaking changes, major refactors

For more info: https://semver.org/
