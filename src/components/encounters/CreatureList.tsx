import type { CreatureEntry } from '../../types/Campaign';
import { createCreatureEntry } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface CreatureListProps {
  creatures: CreatureEntry[];
  onChange: (creatures: CreatureEntry[]) => void;
}

function CreatureList({ creatures, onChange }: CreatureListProps) {
  const addCreature = () => {
    onChange([...creatures, createCreatureEntry('New Creature')]);
  };

  const updateCreature = (id: string, updates: Partial<CreatureEntry>) => {
    onChange(creatures.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCreature = (id: string) => {
    onChange(creatures.filter(c => c.id !== id));
  };

  return (
    <div className="creature-list">
      <label>Creatures</label>
      {creatures.map((creature, idx) => (
        <div key={creature.id} className="creature-row">
          <input
            type="text"
            className="creature-name"
            value={creature.name}
            onChange={(e) => updateCreature(creature.id, { name: e.target.value })}
            placeholder="Creature name"
            aria-label={`Creature ${idx + 1} name`}
          />
          <input
            type="number"
            className="creature-count"
            value={creature.count}
            onChange={(e) => updateCreature(creature.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
            min={1}
            aria-label={`Creature ${idx + 1} count`}
          />
          <input
            type="text"
            className="creature-cr"
            value={creature.cr || ''}
            onChange={(e) => updateCreature(creature.id, { cr: e.target.value || undefined })}
            placeholder="CR"
            aria-label={`Creature ${idx + 1} CR`}
          />
          <input
            type="text"
            className="creature-notes"
            value={creature.notes || ''}
            onChange={(e) => updateCreature(creature.id, { notes: e.target.value || undefined })}
            placeholder="Notes"
            aria-label={`Creature ${idx + 1} notes`}
          />
          <button
            className="btn-icon-small danger"
            onClick={() => removeCreature(creature.id)}
            title="Remove creature"
            aria-label={`Remove creature ${idx + 1}`}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      <button className="add-item-btn" onClick={addCreature}>
        + Add Creature
      </button>
    </div>
  );
}

export default CreatureList;
