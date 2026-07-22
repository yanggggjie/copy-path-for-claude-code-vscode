import * as vscode from 'vscode';
import { build, joinReferences, formatOutput } from '../builders/referenceBuilder';
import { getSettings, ClaudeSettings } from '../config/settings';
import { showCopyNotification } from '../notifications/notifier';
import { plainCopySelection } from './plainCopy';

/**
 * Resolves a URI to a path string.
 * Returns the absolute fsPath when useAbsolutePath is true and the URI is a file,
 * otherwise falls back to the workspace-relative path.
 */
function resolveUriPath(uri: vscode.Uri, useAbsolutePath: boolean): string {
  if (useAbsolutePath && uri.scheme === 'file') {
    return uri.fsPath;
  }
  return vscode.workspace.asRelativePath(uri, false);
}

/**
 * Resolves a relative path string (from copyRelativeFilePath) to an absolute path.
 * Handles multi-root workspaces where the folder name may be prepended.
 * Falls back to the original relative string if resolution fails.
 */
function resolveStringPath(relativePath: string, useAbsolutePath: boolean): string {
  if (!useAbsolutePath) {
    return relativePath;
  }

  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return relativePath;
  }

  for (const folder of folders) {
    // In multi-root workspaces, VS Code may prepend the folder name (e.g. "backend/src/index.ts")
    const folderName = folder.name;
    if (relativePath.startsWith(folderName + '/') || relativePath.startsWith(folderName + '\\')) {
      const candidate = relativePath.slice(folderName.length + 1);
      const absoluteUri = vscode.Uri.joinPath(folder.uri, candidate);
      return absoluteUri.fsPath;
    }
  }

  // Fallback: if no folder name prefix matched, try to find which folder actually contains the file
  for (const folder of folders) {
    const absoluteUri = vscode.Uri.joinPath(folder.uri, relativePath);
    try {
      const fs = require('fs');
      if (fs.existsSync(absoluteUri.fsPath)) {
        return absoluteUri.fsPath;
      }
    } catch {
      // ignore
    }
  }

  // Final fallback: use the first folder
  return vscode.Uri.joinPath(folders[0].uri, relativePath).fsPath;
}

/**
 * Builds reference strings from editor selections.
 * - Single cursor (no selection) → file path, optionally with line number
 * - Multi-cursor or text selection → includes line numbers
 */
function buildEditorRefs(editor: vscode.TextEditor, path: string, refs: string[], settings: ClaudeSettings): void {
  if (editor.selections.length === 1 && editor.selections[0].isEmpty) {
    if (settings.copyCurrentLineWhenNoSelection) {
      const line = editor.selections[0].active.line + 1;
      refs.push(build(path, line));
    } else {
      refs.push(build(path));
    }
    return;
  }

  for (const selection of editor.selections) {
    if (selection.isEmpty) {
      const line = selection.active.line + 1;
      refs.push(build(path, line));
    } else {
      const startLine = selection.start.line + 1;
      let endLine = selection.end.line + 1;

      if (selection.end.character === 0 && endLine > startLine) {
        endLine--;
      }

      refs.push(build(path, startLine, endLine));
    }
  }
}

/**
 * Writes references to clipboard and shows notification.
 */
async function writeAndNotify(refs: string[], settings: ClaudeSettings): Promise<void> {
  if (refs.length === 0) {
    return;
  }

  const joined = joinReferences(refs, settings.multipleReferencesSeparator);
  const finalText = formatOutput(joined, settings.appendTrailingSpace);

  await vscode.env.clipboard.writeText(finalText);

  if (settings.showNotification) {
    const message = refs.length === 1
      ? `Copied: ${refs[0]}`
      : `Copied ${refs.length} references`;
    showCopyNotification(message);
  }
}

/**
 * Main copy command — handles editor context menu, explorer context menu, and keyboard shortcut.
 *
 * Keyboard (no URI args): TextEditor → @path#L…; otherwise plain `copy` (Office / preview).
 */
export async function copyReference(clickedUri?: vscode.Uri, selectedUris?: vscode.Uri[]): Promise<void> {
  const refs: string[] = [];
  const settings = getSettings();

  if (selectedUris && selectedUris.length > 0) {
    for (const uri of selectedUris) {
      refs.push(build(resolveUriPath(uri, settings.useAbsolutePath)));
    }

  } else if (clickedUri) {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.toString() === clickedUri.toString()) {
      buildEditorRefs(editor, resolveUriPath(editor.document.uri, settings.useAbsolutePath), refs, settings);
    } else {
      refs.push(build(resolveUriPath(clickedUri, settings.useAbsolutePath)));
    }

  } else {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      buildEditorRefs(editor, resolveUriPath(editor.document.uri, settings.useAbsolutePath), refs, settings);
    } else {
      // Office / webview: VS Code copy cmds can't see DOM selection → synthesize ⌘C.
      await plainCopySelection();
      return;
    }
  }

  await writeAndNotify(refs, settings);
}

/**
 * Explorer keyboard shortcut command — uses built-in copyRelativeFilePath to get selected paths.
 */
export async function copyFromExplorer(): Promise<void> {
  const savedClipboard = await vscode.env.clipboard.readText();

  await vscode.commands.executeCommand('copyRelativeFilePath');

  const copiedPaths = await vscode.env.clipboard.readText();
  if (copiedPaths === savedClipboard || !copiedPaths.trim()) {
    return;
  }

  const settings = getSettings();

  const refs = copiedPaths
    .split('\n')
    .filter((p: string) => p.trim())
    .map((p: string) => build(resolveStringPath(p.trim(), settings.useAbsolutePath)));

  await writeAndNotify(refs, settings);
}
