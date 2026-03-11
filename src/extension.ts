import * as vscode from 'vscode';
import { copyReference, copyFromExplorer } from './commands/copyReference';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('copyPathForClaudeCode.copy', copyReference),
    vscode.commands.registerCommand('copyPathForClaudeCode.copyFromExplorer', copyFromExplorer)
  );
}

export function deactivate() {}
