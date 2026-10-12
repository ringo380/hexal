import { describe, it, expect } from 'vitest';
import { shortcutLabel } from '../utils/keyboard';

describe('shortcutLabel', () => {
  it('uses Command glyphs on macOS', () => {
    expect(shortcutLabel('Z', { mac: true })).toBe('⌘Z');
    expect(shortcutLabel('Z', { shift: true, mac: true })).toBe('⌘⇧Z');
  });

  it('spells out Ctrl on Windows and Linux', () => {
    expect(shortcutLabel('F', { mac: false })).toBe('Ctrl+F');
    expect(shortcutLabel('Z', { shift: true, mac: false })).toBe('Ctrl+Shift+Z');
  });
});
