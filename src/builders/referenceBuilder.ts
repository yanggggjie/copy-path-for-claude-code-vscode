/**
 * Builds Claude Code reference strings in @path#Lstart-end format.
 * Pure functions — no VSCode API dependency.
 */

export function build(path: string, startLine?: number, endLine?: number): string {
  const normalizedPath = path.replace(/\\/g, '/');

  if (startLine == null) {
    return `@${normalizedPath}`;
  }

  if (endLine == null || endLine === startLine) {
    return `@${normalizedPath}#L${startLine}`;
  }

  return `@${normalizedPath}#L${startLine}-${endLine}`;
}

export function joinReferences(refs: string[], separator: 'Space' | 'Newline'): string {
  const sep = separator === 'Newline' ? '\n' : ' ';
  return refs.join(sep);
}

export function formatOutput(text: string, appendTrailingSpace: boolean): string {
  return appendTrailingSpace ? text + ' ' : text;
}
