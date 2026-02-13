import type { Encounter } from '../../types/Campaign';
// Detail view badges handle their own styling via the constants
import Icon from '../icons/Icon';
import EncounterTypeBadge from './EncounterTypeBadge';
import DifficultyBadge from './DifficultyBadge';
import OutcomeBadge from './OutcomeBadge';

interface EncounterDetailViewProps {
  encounter: Encounter;
}

function EncounterDetailView({ encounter }: EncounterDetailViewProps) {
  return (
    <div className="encounter-detail-card">
      <div className="encounter-detail-header">
        <div className="encounter-detail-badges">
          <EncounterTypeBadge type={encounter.encounterType} />
          <DifficultyBadge difficulty={encounter.difficulty} />
          <OutcomeBadge outcome={encounter.outcome} />
        </div>
      </div>

      {encounter.description && (
        <p className="encounter-detail-description">{encounter.description}</p>
      )}

      {encounter.creatures.length > 0 && (
        <div className="encounter-detail-section">
          <h5><Icon name="sword" size={12} /> Creatures</h5>
          <ul className="encounter-detail-creatures">
            {encounter.creatures.map(c => (
              <li key={c.id}>
                {c.count}x {c.name}
                {c.cr && <span className="creature-cr-tag">{c.cr}</span>}
                {c.notes && <span className="creature-notes-text"> - {c.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {encounter.rewards.length > 0 && (
        <div className="encounter-detail-section">
          <h5><Icon name="sparkle" size={12} /> Rewards</h5>
          <ul className="encounter-detail-rewards">
            {encounter.rewards.map(r => (
              <li key={r.id}>
                <span className="reward-type-label">{r.type}</span>
                {r.description}
                {r.quantity && <span> (x{r.quantity})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {encounter.outcome !== 'pending' && encounter.outcomeNotes && (
        <div className="encounter-detail-section">
          <h5>Outcome Notes</h5>
          <p>{encounter.outcomeNotes}</p>
        </div>
      )}
    </div>
  );
}

export default EncounterDetailView;
