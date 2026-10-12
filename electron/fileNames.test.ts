import { describe, it, expect } from 'vitest';
import { toSafeFileName } from './fileNames';

describe('toSafeFileName', () => {
  describe('win32', () => {
    const safe = (name: string) => toSafeFileName(name, 'win32');

    it('replaces every character Windows rejects', () => {
      expect(safe('Act 1: The Keep')).toBe('Act 1- The Keep');
      expect(safe('a<b>c"d/e\\f|g?h*i')).toBe('a-b-c-d-e-f-g-h-i');
      expect(safe('tab\there')).toBe('tab-here');
    });

    it('strips trailing dots and spaces', () => {
      expect(safe('The End...')).toBe('The End');
      expect(safe('Campaign  ')).toBe('Campaign');
    });

    it('suffixes reserved device names before the first dot', () => {
      expect(safe('Con')).toBe('Con_');
      expect(safe('aux.v2')).toBe('aux_.v2');
      expect(safe('LPT1')).toBe('LPT1_');
      expect(safe('Console')).toBe('Console');
      expect(safe('COM10')).toBe('COM10');
    });

    it('falls back to Untitled when nothing is left', () => {
      expect(safe('')).toBe('Untitled');
      expect(safe('...')).toBe('Untitled');
    });

    it('leaves ordinary names and extensions alone', () => {
      expect(safe('Curse of Strahd')).toBe('Curse of Strahd');
      expect(safe('map.png')).toBe('map.png');
    });
  });

  it('keeps the separator-only rule on other platforms', () => {
    expect(toSafeFileName('Act 1: The Keep', 'darwin')).toBe('Act 1: The Keep');
    expect(toSafeFileName('a/b\\c', 'linux')).toBe('a-b-c');
  });
});
