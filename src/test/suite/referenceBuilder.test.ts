import * as assert from 'assert';
import { build, joinReferences, formatOutput } from '../../builders/referenceBuilder';

suite('ReferenceBuilder', () => {
  test('file path only', () => {
    assert.strictEqual(build('src/Main.ts'), '@src/Main.ts');
  });

  test('folder path', () => {
    assert.strictEqual(build('src/components'), '@src/components');
  });

  test('single line', () => {
    assert.strictEqual(build('src/Main.ts', 5), '@src/Main.ts#L5');
  });

  test('line range', () => {
    assert.strictEqual(build('src/Main.ts', 5, 10), '@src/Main.ts#L5-10');
  });

  test('same start and end line collapses to single', () => {
    assert.strictEqual(build('src/Main.ts', 5, 5), '@src/Main.ts#L5');
  });

  test('root file', () => {
    assert.strictEqual(build('package.json'), '@package.json');
  });

  test('deeply nested path', () => {
    assert.strictEqual(build('src/components/ui/Button.tsx', 10, 25), '@src/components/ui/Button.tsx#L10-25');
  });

  test('line 1', () => {
    assert.strictEqual(build('src/Main.ts', 1), '@src/Main.ts#L1');
  });

  test('backslash normalization', () => {
    assert.strictEqual(build('src\\utils\\auth.ts', 42), '@src/utils/auth.ts#L42');
  });

  test('join with space', () => {
    assert.strictEqual(joinReferences(['@a.ts', '@b.ts'], 'Space'), '@a.ts @b.ts');
  });

  test('join with newline', () => {
    assert.strictEqual(joinReferences(['@a.ts', '@b.ts'], 'Newline'), '@a.ts\n@b.ts');
  });

  test('format with trailing space', () => {
    assert.strictEqual(formatOutput('@a.ts', true), '@a.ts ');
  });

  test('format without trailing space', () => {
    assert.strictEqual(formatOutput('@a.ts', false), '@a.ts');
  });
});
