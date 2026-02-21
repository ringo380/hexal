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
