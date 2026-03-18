// EncounterOverlay — Full-screen overlay showing a revealed encounter to players

import type { ActiveEncounter } from '../../types/Campaign';
import { ENCOUNTER_TYPE_INFO } from '../../types/Campaign';
import CreatureCard from './CreatureCard';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface EncounterOverlayProps {
  encounter: ActiveEncounter;
  onDismiss: () => void;
}

function EncounterOverlay({ encounter, onDismiss }: EncounterOverlayProps) {
  const typeInfo = ENCOUNTER_TYPE_INFO[encounter.encounterType];
  const overlayRef = useFocusTrap({ onEscape: onDismiss });

  return (
    <div className="encounter-overlay" onClick={onDismiss}>
      <div className="encounter-overlay-card" ref={overlayRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="encounter-overlay-header">
          <h1 className="encounter-overlay-title">{encounter.title}</h1>
          <span
            className="encounter-overlay-type-badge"
            style={{ background: typeInfo.color }}
          >
            {typeInfo.label}
          </span>
        </div>

        {/* Context */}
        <div className="encounter-overlay-context">
          {encounter.terrain && (
            <span className="encounter-overlay-terrain">{encounter.terrain}</span>
          )}
          {encounter.regionName && (
            <span className="encounter-overlay-region">{encounter.regionName}</span>
          )}
        </div>

        {/* Description */}
        {encounter.description && (
          <p className="encounter-overlay-description">{encounter.description}</p>
        )}

        {/* Creatures */}
        {encounter.creatures.length > 0 && (
          <div className="encounter-overlay-creatures">
            <h2 className="encounter-overlay-creatures-title">Creatures</h2>
            <div className="encounter-overlay-creatures-grid">
              {encounter.creatures.map((creature, idx) => (
                <CreatureCard
                  key={idx}
                  name={creature.name}
                  count={creature.count}
                  cr={creature.cr}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EncounterOverlay;
