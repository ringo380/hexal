import { memo } from 'react';
import type { Encounter, EncounterType, EncounterOutcome } from '../../types/Campaign';
import Icon from '../icons/Icon';
import EncounterTypeBadge from './EncounterTypeBadge';
import DifficultyBadge from './DifficultyBadge';
import OutcomeBadge from './OutcomeBadge';
import { onActivate } from '../../utils/keyboard';
import { useInlineEdit } from '../../hooks/useInlineEdit';

const ENCOUNTER_TYPES: EncounterType[] = ['combat', 'social', 'exploration', 'puzzle'];
const OUTCOME_TYPES: EncounterOutcome[] = ['pending', 'victory', 'defeat', 'fled', 'negotiated', 'bypassed'];

interface EncounterRowProps {
  encounter: Encounter;
  onToggleResolved: () => void;
  onSave: (encounter: Encounter) => void;
  onEditFull: () => void;
  onDelete: () => void;
}

function EncounterRow({ encounter, onToggleResolved, onSave, onEditFull, onDelete }: EncounterRowProps) {
  const { isEditing, draft, setDraft, startEditing, save, cancel, containerRef } = useInlineEdit<Encounter>({ onSave });

  if (isEditing && draft) {
    return (
      <div className="inline-edit-form" ref={containerRef}>
        <div className="field-group">
          <label>Title</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            autoFocus
          />
        </div>
        <div className="inline-edit-row">
          <div className="field-group">
            <label>Type</label>
            <select value={draft.encounterType} onChange={(e) => setDraft({ ...draft, encounterType: e.target.value as EncounterType })}>
              {ENCOUNTER_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label>Difficulty</label>
            <input
              type="text"
              value={draft.difficulty ?? ''}
              onChange={(e) => setDraft({ ...draft, difficulty: e.target.value || undefined })}
              placeholder="e.g., CR 2"
            />
          </div>
          <div className="field-group">
            <label>Outcome</label>
            <select value={draft.outcome} onChange={(e) => setDraft({ ...draft, outcome: e.target.value as EncounterOutcome })}>
              {OUTCOME_TYPES.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="field-group">
          <label>Description</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="inline-edit-actions">
          <button className="btn btn-secondary btn-small" onClick={cancel}>Cancel</button>
          <button className="btn btn-secondary btn-small" onClick={() => { save(); onEditFull(); }}>Edit Details...</button>
          <button className="btn btn-primary btn-small" onClick={save}>Save</button>
        </div>
      </div>
    );
  }

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
      <div className="encounter-row-content" role="button" tabIndex={0} aria-label={`Edit ${encounter.title}`} onClick={() => startEditing(encounter)} onKeyDown={onActivate(() => startEditing(encounter))}>
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
        <button className="edit-btn" onClick={() => startEditing(encounter)} title="Edit" aria-label="Edit">
          <Icon name="pencil" size={14} />
        </button>
        <button className="delete-btn" onClick={onDelete} title="Delete" aria-label="Delete">
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
}

function areEqual(prev: EncounterRowProps, next: EncounterRowProps) {
  return prev.encounter === next.encounter;
}

export default memo(EncounterRow, areEqual);
