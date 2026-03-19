# Design Spec: Copy Current Line & Absolute Path

**Date:** 2026-03-19
**Project:** copy-path-for-claude-code-vscode
**Status:** Approved

---

## Overview

Two new features to be added to the VS Code extension:

1. **Copy current line when no selection** — When the cursor is in the editor with no text selected, copy the path with the cursor's line number appended (e.g. `@src/config/settings.ts#L9`) instead of just the file path.
2. **Use absolute path by default** — Copy the full absolute filesystem path (e.g. `@/Users/xxx/project/src/config/settings.ts`) instead of the workspace-relative path.

Both features are controlled by new settings, both defaulting to `true`.

---

## Feature 1: Copy Current Line When No Selection

### Current Behavior

In `buildEditorRefs` (`src/commands/copyReference.ts`):
- Single cursor, empty selection → `build(relativePath)` → `@src/config/settings.ts` (no line number)
- Cursor with selection → `build(relativePath, line)` → `@src/config/settings.ts#L9`

### New Behavior

When `copyPathForClaudeCode.copyCurrentLineWhenNoSelection` is `true`:
- Single cursor, empty selection → `build(path, cursorLine)` → `@src/config/settings.ts#L9`

When the setting is `false`, existing behavior is preserved.

### New Setting

| Property | Value |
|---|---|
| Key | `copyPathForClaudeCode.copyCurrentLineWhenNoSelection` |
| Type | `boolean` |
| Default | `true` |
| Description | When no text is selected, include the cursor's line number in the copied reference |

### Code Changes

- `src/config/settings.ts`: Add `copyCurrentLineWhenNoSelection: boolean` to `ClaudeSettings` interface and `getSettings()`.
- `package.json` `contributes.configuration.properties`: Add the new config entry.
- `src/commands/copyReference.ts` `buildEditorRefs`: When single empty selection and setting is enabled, pass `selection.active.line + 1` as `startLine` to `build()`.

---

## Feature 2: Use Absolute Path

### Current Behavior

All paths are resolved via `vscode.workspace.asRelativePath(uri, false)`, producing workspace-relative paths like `src/config/settings.ts`.

`copyFromExplorer` uses the built-in `copyRelativeFilePath` command, which always returns relative paths.

### New Behavior

When `copyPathForClaudeCode.useAbsolutePath` is `true`:
- Editor paths use `uri.fsPath` (absolute) instead of `vscode.workspace.asRelativePath(uri, false)`.
- Explorer paths: after reading the relative path from clipboard, resolve to absolute by looking up the matching workspace folder via `vscode.workspace.workspaceFolders`.

When the setting is `false`, existing behavior is preserved.

### New Setting

| Property | Value |
|---|---|
| Key | `copyPathForClaudeCode.useAbsolutePath` |
| Type | `boolean` |
| Default | `true` |
| Description | Copy the full absolute filesystem path instead of the workspace-relative path |

### Code Changes

- `src/config/settings.ts`: Add `useAbsolutePath: boolean` to `ClaudeSettings` interface and `getSettings()`.
- `package.json` `contributes.configuration.properties`: Add the new config entry.
- `src/commands/copyReference.ts`:
  - Extract helper `resolveFilePath(uri: vscode.Uri, useAbsolutePath: boolean): string` — returns `uri.fsPath` or `vscode.workspace.asRelativePath(uri, false)`.
  - Update `copyReference()` to call `resolveFilePath` everywhere a path is resolved from a URI.
  - Update `copyFromExplorer()` to resolve the relative path string to absolute when the setting is enabled. Use `vscode.workspace.workspaceFolders?.[0]?.uri.fsPath` to construct the absolute path.

---

## Architecture Summary

```
package.json (config declarations)
    ↓
src/config/settings.ts (ClaudeSettings + getSettings)
    ↓
src/commands/copyReference.ts
  ├── resolveFilePath(uri, useAbsolutePath) — new helper
  ├── buildEditorRefs(editor, path, refs, settings) — updated
  ├── copyReference() — updated
  └── copyFromExplorer() — updated
```

The `referenceBuilder.ts` and `notifier.ts` files are not changed — path resolution is kept entirely within the command layer.

---

## Error Handling

- If `vscode.workspace.workspaceFolders` is undefined or empty in `copyFromExplorer` (absolute mode), fall back to the relative path so the extension never silently fails.
- No other error paths are introduced.

---

## Testing

- Unit tests in `src/test/suite/referenceBuilder.test.ts` do not need changes (pure builder functions are unchanged).
- Manual test matrix:
  - [ ] No selection, setting ON → path with line number
  - [ ] No selection, setting OFF → path only (no line)
  - [ ] Selection, setting ON → path with line range (unchanged)
  - [ ] Absolute ON, editor file → absolute path
  - [ ] Absolute OFF, editor file → relative path (existing behavior)
  - [ ] Absolute ON, explorer selection → absolute path
  - [ ] Absolute OFF, explorer selection → relative path
