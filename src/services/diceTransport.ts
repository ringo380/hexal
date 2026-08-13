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
      const unsubscribeHistory = window.electronAPI.onDiceHistory(handlers.onHistory);
      return () => {
        unsubscribeRoll();
        unsubscribeHistory();
      };
    },
  };
}
