import * as vscode from 'vscode';
import { build, joinReferences, formatOutput } from '../builders/referenceBuilder';
import { getSettings } from '../config/settings';
import { showCopyNotification } from '../notifications/notifier';

/**
 * Builds reference strings from editor selections.
 * - Single cursor (no selection) → file path only
 * - Multi-cursor or text selection → includes line numbers
 */
function buildEditorRefs(editor: vscode.TextEditor, relativePath: string, refs: string[]): void {
  if (editor.selections.length === 1 && editor.selections[0].isEmpty) {
    refs.push(build(relativePath));
    return;
  }

  for (const selection of editor.selections) {
    if (selection.isEmpty) {
      const line = selection.active.line + 1;
      refs.push(build(relativePath, line));
    } else {
      const startLine = selection.start.line + 1;
      let endLine = selection.end.line + 1;

      if (selection.end.character === 0 && endLine > startLine) {
        endLine--;
      }

      refs.push(build(relativePath, startLine, endLine));
    }
  }
}

/**
 * Writes references to clipboard and shows notification.
 */
async function writeAndNotify(refs: string[]): Promise<void> {
  if (refs.length === 0) {
    return;
  }

  const settings = getSettings();
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
 */
export async function copyReference(clickedUri?: vscode.Uri, selectedUris?: vscode.Uri[]): Promise<void> {
  const refs: string[] = [];

  if (selectedUris && selectedUris.length > 0) {
    for (const uri of selectedUris) {
      refs.push(build(vscode.workspace.asRelativePath(uri, false)));
    }

  } else if (clickedUri) {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.toString() === clickedUri.toString()) {
      buildEditorRefs(editor, vscode.workspace.asRelativePath(editor.document.uri, false), refs);
    } else {
      refs.push(build(vscode.workspace.asRelativePath(clickedUri, false)));
    }

  } else {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('Copy Path for Claude Code: No active editor');
      return;
    }
    buildEditorRefs(editor, vscode.workspace.asRelativePath(editor.document.uri, false), refs);
  }

  await writeAndNotify(refs);
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

  const refs = copiedPaths
    .split('\n')
    .filter((p: string) => p.trim())
    .map((p: string) => build(p.trim()));

  await writeAndNotify(refs);
}
