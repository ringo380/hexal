// DiceToolbarButton — subscribes to DiceContext itself (CombatToolbarButton
// precedent) so remote roll arrivals don't force MainEditor to re-render.
// Manages its own anchored popover (ProfileMenu precedent): ref-based
// contains() outside-click dismissal + Escape, not stopPropagation + window
// listener (React synthetic stopPropagation does not block native window
// listeners). The popover is not a modal - no focus trap.

import { useEffect, useRef, useState } from 'react';
import { useDice } from '../../stores/DiceContext';
import { useToast } from '../../stores/ToastContext';
import { useAnnounce } from '../../stores/AnnouncerContext';
import { formatRoll } from '../../services/diceService';
import Icon from '../icons/Icon';
import DicePanel from './DicePanel';

function DiceToolbarButton() {
  const { history, roll, lastRemoteRoll } = useDice();
  const toast = useToast();
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Skip the initial mount so an already-populated lastRemoteRoll (e.g. a
  // late-join history replay that arrived before this component mounted)
  // doesn't fire a toast for something that already happened.
  const isFirstMount = useRef(true);

  // lastRemoteRoll is only ever set by DiceContext's ADD_REMOTE reducer
  // case, and only when the roll is actually appended (not a duplicate) -
  // own rolls never touch it, so no local-id bookkeeping is needed here.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (!lastRemoteRoll) return;
    const message = `${formatRoll(lastRemoteRoll)} - ${lastRemoteRoll.roller.name}`;
    toast(message);
    announce(message);
  }, [lastRemoteRoll, toast, announce]);

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
            onRoll={roll}
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
