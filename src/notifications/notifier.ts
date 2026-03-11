import * as vscode from 'vscode';

export function showCopyNotification(message: string): void {
  vscode.window.showInformationMessage(message);
}
