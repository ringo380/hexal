// DiceHistoryList — renders roll history newest-first. Individual die values
// are rendered as their own spans (not formatRoll's plain-text output) so
// discarded advantage/disadvantage dice can be struck through visually.

import { formatRoll } from '../../services/diceService';
import type { DiceRoll } from '../../types';

interface DiceHistoryListProps {
  rolls: DiceRoll[];
}

function DiceHistoryList({ rolls }: DiceHistoryListProps) {
  if (rolls.length === 0) {
    return <p className="empty-hint dice-history-empty">No rolls yet.</p>;
  }

  const newestFirst = [...rolls].reverse();

  return (
    <ul className="dice-history-list">
      {newestFirst.map((roll) => (
        <li key={roll.id} className="dice-history-item" aria-label={formatRoll(roll)}>
          <div className="dice-history-row">
            <span className="dice-history-notation">{roll.notation}</span>
            <span className="dice-history-total">{roll.total}</span>
            {roll.isHidden && <span className="dice-history-hidden-badge">Hidden</span>}
          </div>
          <div className="dice-history-values">
            {roll.rolls.map((die, index) => (
              <span
                key={index}
                className={`dice-history-value${die.discarded ? ' discarded' : ''}`}
              >
                {die.value}
              </span>
            ))}
            {roll.modifier !== 0 && (
              <span className="dice-history-modifier">
                {roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier}
              </span>
            )}
          </div>
          <div className="dice-history-roller">{roll.roller.name}</div>
        </li>
      ))}
    </ul>
  );
}

export default DiceHistoryList;
