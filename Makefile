.PHONY: help release-major release-minor release-patch version og og-build og-update og-link

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Release Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Current version: $(shell node -p "require('./packages/core/package.json').version")"

version: ## Display current version
	@node -p "require('./packages/core/package.json').version"

release-major: ## Bump major version (e.g., 0.1.0 → 1.0.0)
	@pnpm release:major

release-minor: ## Bump minor version (e.g., 0.1.0 → 0.2.0)
	@pnpm release:minor

release-patch: ## Bump patch version (e.g., 0.1.0 → 0.1.1)
	@pnpm release:patch

og-build: ## Build the server + desktop bundles (no install)
	@pnpm build:server
	@pnpm build:desktop

og-update: ## Reinstall deps and rebuild the desktop bundle
	@./scripts/og-update

og-update-pull: ## git pull, reinstall deps, rebuild the desktop bundle
	@./scripts/og-update --pull

og-link: ## Symlink og + og-update into ~/.local/bin (override with DIR=...)
	@./scripts/og-link $(DIR)

og: ## Launch the bundled app against $(DIR) or $$PWD (e.g. make og DIR=~/foo)
	@./scripts/og "$(DIR)"
