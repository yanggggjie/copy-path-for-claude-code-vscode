# Copy Path for Claude Code VS Code Extension — Just commands
# https://github.com/casey/just

VSCODE_VSIX := justfile_directory() + "/copy-path-for-agent-1.1.5.vsix"

# Default: show available commands
default:
    @just --list

# ── Build & Package ──────────────────────────────────────────────────────────

# Type-check only
check-types:
    @echo "🔍 Type checking..."
    npx tsc --noEmit

# Lint with eslint
lint:
    @echo "🧹 Linting..."
    npm run lint

# Compile extension with tsc
compile:
    @echo "🔨 Compiling..."
    npm run compile

# Package extension into .vsix file (deletes old .vsix first)
package: clean
    @echo "📦 Packaging extension..."
    npm run vscode:prepublish
    npx @vscode/vsce package --no-dependencies
    @echo "✅ Packaged: {{VSCODE_VSIX}}"

# ── Install ──────────────────────────────────────────────────────────────────

# Install the VS Code extension from .vsix (rebuilds and deletes old .vsix first)
install: package
    @echo "🔌 Installing to VS Code..."
    code --install-extension {{VSCODE_VSIX}}
    @echo "✅ Installed"

# ── Development ──────────────────────────────────────────────────────────────

# Watch mode: rebuild on file changes
watch:
    @echo "👀 Watching for changes..."
    npm run watch

# ── Clean ────────────────────────────────────────────────────────────────────

# Clean build artifacts
clean:
    rm -rf out/
    rm -f *.vsix
    find . -name "*.pyc" -delete
    find . -name "__pycache__" -type d -delete
