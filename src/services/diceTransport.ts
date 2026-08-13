import type { DiceRoll, DiceTransport } from '../types';

// Wires DiceContext's transport prop to the Electron IPC bridge. Returns
// undefined when the bridge method isn't present (web player bundle, tests),
// so callers can fall back to local-only rolling.
export function createElectronDiceTransport(): DiceTransport | undefined {
  if (!window.electronAPI?.sendDiceRoll) {
    return undefined;
  }

  return {
    send(roll: DiceRoll): void {
      window.electronAPI.sendDiceRoll(roll);
    },
    subscribe(handlers: { onRoll(r: DiceRoll): void; onHistory(rolls: DiceRoll[]): void }): () => void {
      const unsubscribeRoll = window.electronAPI.onDiceRoll(handlers.onRoll);

      // Pulled rather than pushed: a did-finish-load push can fire before
      // this subscribe() call has wired up the renderer's listener,
      // guaranteeing loss for a brand-new window. Fetching after the
      // listener is attached means no arrival can be missed.
      let cancelled = false;
      window.electronAPI
        .getDiceHistory()
        .then((rolls) => {
          if (!cancelled && Array.isArray(rolls) && rolls.length > 0) {
            handlers.onHistory(rolls);
          }
        })
        .catch(() => {
          // No history available yet - not fatal, the panel just starts empty.
        });

      return () => {
        cancelled = true;
        unsubscribeRoll();
      };
    },
  };
}
