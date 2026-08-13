// DiceToolbarButton — subscribes to DiceContext itself (CombatToolbarButton
// precedent) so remote roll arrivals don't force MainEditor to re-render.
// Manages its own anchored popover (ProfileMenu precedent): ref-based
// contains() outside-click dismissal + Escape, not stopPropagation + window
// listener (React synthetic stopPropagation does not block native window
// listeners). The popover is not a modal - no focus trap.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDice } from '../../stores/DiceContext';
import { useToast } from '../../stores/ToastContext';
import { useAnnounce } from '../../stores/AnnouncerContext';
import { formatRoll } from '../../services/diceService';
import type { DiceAdvantage, DiceRoll } from '../../types';
import Icon from '../icons/Icon';
import DicePanel from './DicePanel';

// Caps the locally-created id set so a very long session doesn't grow it
// unbounded; matches DiceContext's own history cap.
const LOCAL_ID_CAP = 50;

function DiceToolbarButton() {
  const { history, roll } = useDice();
  const toast = useToast();
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ids of rolls this window created locally, so their own arrival back
  // through the transport (or in local history) never triggers a toast.
  const localIdsRef = useRef<Set<string>>(new Set());
  // Ids already processed for toast/announce purposes, so the initial
  // history replay on mount doesn't fire a toast per entry.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstHistoryEffect = useRef(true);

  const handleRoll = useCallback(
    (
      input: string | { sides: number; count: number },
      opts: { advantage: DiceAdvantage; modifier: number; isHidden?: boolean }
    ): DiceRoll => {
      const result = roll(input, opts);
      localIdsRef.current.add(result.id);
      if (localIdsRef.current.size > LOCAL_ID_CAP) {
        const oldest = localIdsRef.current.values().next();
        if (!oldest.done) localIdsRef.current.delete(oldest.value);
      }
      seenIdsRef.current.add(result.id);
      return result;
    },
    [roll]
  );

  // Remote roll arrival = a history entry we didn't just create locally.
  // Skip both the initial mount AND any later history-replay pass - the
  // 'dice-history' IPC replay (electron/main.ts, sent on did-finish-load)
  // lands asynchronously after mount, so it can arrive as a later effect
  // run rather than the first one. A genuine single remote roll always
  // appends exactly one unseen, non-local id at the tail of history; a
  // replay/replacement (SET_HISTORY) can surface many unseen ids at once,
  // or ids inserted anywhere - anything short of that single-tail shape is
  // treated as a silent resync, not a notification.
  useEffect(() => {
    if (isFirstHistoryEffect.current) {
      isFirstHistoryEffect.current = false;
      history.forEach((r) => seenIdsRef.current.add(r.id));
      return;
    }
    const unseenRemote = history.filter(
      (r) => !seenIdsRef.current.has(r.id) && !localIdsRef.current.has(r.id)
    );
    history.forEach((r) => seenIdsRef.current.add(r.id));
    const last = history[history.length - 1];
    if (unseenRemote.length === 1 && last && unseenRemote[0].id === last.id) {
      const message = `${formatRoll(last)} - ${last.roller.name}`;
      toast(message);
      announce(message);
    }
  }, [history, toast, announce]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="dice-toolbar-anchor" ref={containerRef}>
      <button
        type="button"
        className={`btn btn-secondary${open ? ' btn-active' : ''}`}
        aria-label="Dice roller"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="dice" size={16} /> Dice
      </button>

      {open && (
        <div className="dice-toolbar-popover" role="region" aria-label="Dice roller">
          <DicePanel
            onRoll={handleRoll}
            history={history}
            showHiddenToggle={true}
            announce={announce}
          />
        </div>
      )}
    </div>
  );
}

export default DiceToolbarButton;
