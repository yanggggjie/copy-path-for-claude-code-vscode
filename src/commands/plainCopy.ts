import { execFile } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

/**
 * Copy the current selection when there is no TextEditor (Office / webview preview).
 * VS Code copy commands only see Monaco selections; webview selections need a real ⌘C.
 * On macOS we synthesize Cmd+C via System Events (requires Accessibility for Code).
 */
export async function plainCopySelection(): Promise<void> {
  if (process.platform === 'darwin') {
    try {
      await execFileAsync('osascript', [
        '-e',
        'tell application "System Events" to keystroke "c" using command down',
      ]);
      return;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      vscode.window.showWarningMessage(
        `Copy Path: could not synthesize ⌘C (${detail}). Grant Accessibility to Visual Studio Code / osascript in System Settings, or press ⌘C.`
      );
    }
  }

  const commands = await vscode.commands.getCommands(true);
  const plainCopyId = commands.includes('execCopy')
    ? 'execCopy'
    : 'editor.action.clipboardCopyAction';
  await vscode.commands.executeCommand(plainCopyId);
}
