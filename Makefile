.PHONY: help release-major release-minor release-patch version

.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Release Management Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Current version: $(shell node -p "require('./package.json').version")"

version: ## Display current version
	@node -p "require('./package.json').version"

release-major: ## Bump major version (e.g., 0.1.0 → 1.0.0)
	@bun run scripts/bump-version.ts --major

release-minor: ## Bump minor version (e.g., 0.1.0 → 0.2.0)
	@bun run scripts/bump-version.ts --minor

release-patch: ## Bump patch version (e.g., 0.1.0 → 0.1.1)
	@bun run scripts/bump-version.ts --patch
