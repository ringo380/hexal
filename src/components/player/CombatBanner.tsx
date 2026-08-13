// CombatBanner - player-facing initiative display: turn order, current
// turn highlight, round counter, and condition badges. No HP is ever
// present in the payload (stripped DM-side by filterCombatForPlayer).

import type { PlayerCombatState } from '../../types/Combat';

interface CombatBannerProps {
  combat: PlayerCombatState;
}

function CombatBanner({ combat }: CombatBannerProps) {
  return (
    <div className="player-combat-banner" role="region" aria-label="Combat initiative order">
      <div className="player-combat-header">
        <span className="player-combat-title">Combat</span>
        <span className="player-combat-round">Round {combat.round}</span>
      </div>
      <ol className="player-combat-list">
        {combat.combatants.map(combatant => (
          <li
            key={combatant.id}
            className={`player-combat-entry${combatant.isCurrentTurn ? ' current' : ''}${combatant.kind === 'pc' ? ' pc' : ''}`}
          >
            <span className="player-combat-name">
              {combatant.name}
              {combatant.isCurrentTurn && <span className="sr-only"> (current turn)</span>}
            </span>
            {combatant.conditions.length > 0 && (
              <span className="player-combat-conditions">
                {combatant.conditions.map(condition => (
                  <span key={condition} className="player-condition-badge">{condition}</span>
                ))}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default CombatBanner;
