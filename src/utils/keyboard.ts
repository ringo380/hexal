import { KeyboardEvent } from 'react';

/**
 * Returns an onKeyDown handler that fires the given callback on Enter or Space.
 * Space is preventDefault'd to avoid scrolling.
 */
export function onActivate(handler: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.key === ' ') e.preventDefault();
      handler();
    }
  };
}

export const IS_MAC = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

/** Modifier name for CmdOrCtrl shortcuts: the Command glyph on macOS, "Ctrl" elsewhere. */
export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

/**
 * Display text for a CmdOrCtrl shortcut in tooltips and placeholders:
 * "⌘⇧Z" on macOS, "Ctrl+Shift+Z" elsewhere.
 */
export function shortcutLabel(key: string, { shift = false, mac = IS_MAC } = {}): string {
  if (mac) return `⌘${shift ? '⇧' : ''}${key}`;
  return `Ctrl+${shift ? 'Shift+' : ''}${key}`;
}
