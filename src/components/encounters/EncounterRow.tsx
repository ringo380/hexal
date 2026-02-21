import type { Encounter } from '../../types/Campaign';
import Icon from '../icons/Icon';
import EncounterTypeBadge from './EncounterTypeBadge';
import DifficultyBadge from './DifficultyBadge';
import OutcomeBadge from './OutcomeBadge';
import { onActivate } from '../../utils/keyboard';

interface EncounterRowProps {
  encounter: Encounter;
  onToggleResolved: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EncounterRow({ encounter, onToggleResolved, onEdit, onDelete }: EncounterRowProps) {
  return (
    <div className={`encounter-row ${encounter.isResolved ? 'resolved' : ''}`}>
      <button
        className="resolve-btn"
        onClick={onToggleResolved}
        title={encounter.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
        aria-label={encounter.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
      >
        <Icon name={encounter.isResolved ? 'check' : 'circle'} size={14} />
      </button>
      <div className="encounter-row-content" role="button" tabIndex={0} aria-label={`Edit ${encounter.title}`} onClick={onEdit} onKeyDown={onActivate(onEdit)}>
        <div className="encounter-row-header">
          <span className="item-title">{encounter.title}</span>
          <div className="encounter-row-badges">
            <EncounterTypeBadge type={encounter.encounterType} size="small" />
            <DifficultyBadge difficulty={encounter.difficulty} size="small" />
            <OutcomeBadge outcome={encounter.outcome} size="small" />
          </div>
        </div>
        <div className="encounter-row-meta">
          {encounter.creatures.length > 0 && (
            <span className="encounter-row-creatures">
              {encounter.creatures.reduce((sum, c) => sum + c.count, 0)} creature{encounter.creatures.reduce((sum, c) => sum + c.count, 0) !== 1 ? 's' : ''}
            </span>
          )}
          {encounter.description && (
            <span className="item-description">{encounter.description}</span>
          )}
        </div>
      </div>
      <div className="item-actions">
        <button className="edit-btn" onClick={onEdit} title="Edit" aria-label="Edit">
          <Icon name="pencil" size={14} />
        </button>
        <button className="delete-btn" onClick={onDelete} title="Delete" aria-label="Delete">
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
}

export default EncounterRow;
