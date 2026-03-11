# Copy Path for Claude Code

VS Code extension that copies file/folder references in Claude Code `@`-mention format (`@path/to/file#L42-68`).

## Features

| Action | Result |
|--------|--------|
| Copy file path | `@src/auth.ts` |
| Copy folder path | `@src/components` |
| Copy with line selection | `@src/auth.ts#L10-25` |
| Multi-cursor | `@src/auth.ts#L5 @src/auth.ts#L20` |
| Multi-file selection | `@src/auth.ts @src/utils.ts` |

## Usage

### Context Menu

- **Editor:** Right-click → **Copy Path for Claude Code**
- **Explorer:** Right-click file/folder → **Copy Path for Claude Code**

### Keyboard Shortcut

| Context | Shortcut | Behavior |
|---------|----------|----------|
| Editor (no selection) | `Alt+C` | Copy file path |
| Editor (with selection) | `Alt+C` | Copy with line range |
| Explorer | `Alt+C` | Copy selected file/folder paths |

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `appendTrailingSpace` | boolean | `true` | Append trailing space after copied reference |
| `multipleReferencesSeparator` | enum | `Space` | Separator between multiple references (`Space` / `Newline`) |
| `showNotification` | boolean | `true` | Show notification after copying |

> Settings prefix: `copyPathForClaudeCode.`

## License

[MIT](LICENSE)
