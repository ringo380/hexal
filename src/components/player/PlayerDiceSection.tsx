// PlayerDiceSection — Dice roller panel content for the player view. Rendered
// inside PlayerView's DiceProvider, so it subscribes to DiceContext itself
// (DiceToolbarButton precedent) rather than PlayerView threading history/roll
// down as props. Controlled open/close (PlayerView owns the boolean, matching
// its existing showJournal/showQuestLog pattern) - only the toggle button
// lives in PlayerView, since that button also needs to gate on playerName
// before this ever mounts open.
//
// Player rolls are never hidden (showHiddenToggle: false) - there is no
// player-visible remote-roll toast surface (MessageToast is DM-message
// shaped); incoming rolls surface through the shared history list instead.

import { useDice } from '../../stores/DiceContext';
import DicePanel from '../dice/DicePanel';

interface PlayerDiceSectionProps {
  onClose: () => void;
}

function PlayerDiceSection({ onClose }: PlayerDiceSectionProps) {
  const { history, roll } = useDice();

  return (
    <div className="player-dice-panel">
      <div className="player-dice-panel-header">
        <h2>Dice Roller</h2>
        <button
          type="button"
          className="player-journal-close"
          onClick={onClose}
          aria-label="Close dice roller"
        >
          &times;
        </button>
      </div>
      <DicePanel onRoll={roll} history={history} showHiddenToggle={false} />
    </div>
  );
}

export default PlayerDiceSection;
