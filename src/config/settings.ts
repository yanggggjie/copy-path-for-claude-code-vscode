import * as vscode from 'vscode';

export interface ClaudeSettings {
  appendTrailingSpace: boolean;
  multipleReferencesSeparator: 'Space' | 'Newline';
  showNotification: boolean;
  copyCurrentLineWhenNoSelection: boolean;
  useAbsolutePath: boolean;
}

export function getSettings(): ClaudeSettings {
  const config = vscode.workspace.getConfiguration('copyPathForClaudeCode');
  return {
    appendTrailingSpace: config.get<boolean>('appendTrailingSpace', true),
    multipleReferencesSeparator: config.get<'Space' | 'Newline'>('multipleReferencesSeparator', 'Space'),
    showNotification: config.get<boolean>('showNotification', true),
    copyCurrentLineWhenNoSelection: config.get<boolean>('copyCurrentLineWhenNoSelection', true),
    useAbsolutePath: config.get<boolean>('useAbsolutePath', true),
  };
}
