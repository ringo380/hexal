import { memo } from 'react';
import type { Npc, Faction, NpcAttitude } from '../../types/Campaign';
import Icon from '../icons/Icon';
import AlignmentBadge from './AlignmentBadge';
import AttitudeBadge from './AttitudeBadge';
import FactionBadge from './FactionBadge';
import { onActivate } from '../../utils/keyboard';
import { useInlineEdit } from '../../hooks/useInlineEdit';

const ATTITUDE_OPTIONS: NpcAttitude[] = ['friendly', 'indifferent', 'hostile', 'unknown'];

interface NpcRowProps {
  npc: Npc;
  faction?: Faction;
  onToggleResolved: () => void;
  onSave: (npc: Npc) => void;
  onEditFull: (npc: Npc) => void;
  onDelete: () => void;
}

function NpcRow({ npc, faction, onToggleResolved, onSave, onEditFull, onDelete }: NpcRowProps) {
  const { isEditing, draft, setDraft, startEditing, save, cancel, containerRef } = useInlineEdit<Npc>({ onSave });

  if (isEditing && draft) {
    return (
      <div className="inline-edit-form" ref={containerRef}>
        <div className="field-group">
          <label htmlFor={`npc-name-${draft.id}`}>Name</label>
          <input
            id={`npc-name-${draft.id}`}
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            autoFocus
          />
        </div>
        <div className="inline-edit-row">
          <div className="field-group">
            <label htmlFor={`npc-race-${draft.id}`}>Race</label>
            <input
              id={`npc-race-${draft.id}`}
              type="text"
              value={draft.race ?? ''}
              onChange={(e) => setDraft({ ...draft, race: e.target.value || undefined })}
              placeholder="e.g., Human"
            />
          </div>
          <div className="field-group">
            <label htmlFor={`npc-class-${draft.id}`}>Class</label>
            <input
              id={`npc-class-${draft.id}`}
              type="text"
              value={draft.class ?? ''}
              onChange={(e) => setDraft({ ...draft, class: e.target.value || undefined })}
              placeholder="e.g., Fighter"
            />
          </div>
        </div>
        <div className="inline-edit-row">
          <div className="field-group">
            <label htmlFor={`npc-attitude-${draft.id}`}>Attitude</label>
            <select id={`npc-attitude-${draft.id}`} value={draft.attitude ?? 'unknown'} onChange={(e) => setDraft({ ...draft, attitude: e.target.value as NpcAttitude })}>
              {ATTITUDE_OPTIONS.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="inline-checkbox-label">
              <input
                type="checkbox"
                checked={draft.isAlive}
                onChange={(e) => setDraft({ ...draft, isAlive: e.target.checked })}
              />
              Alive
            </label>
          </div>
        </div>
        <div className="inline-edit-actions">
          <button className="btn btn-secondary btn-small" onClick={cancel}>Cancel</button>
          <button className="btn btn-secondary btn-small" onClick={() => { save(); onEditFull(draft); }}>Edit Details...</button>
          <button className="btn btn-primary btn-small" onClick={save}>Save</button>
        </div>
      </div>
    );
  }

  const subtitle = [npc.race, npc.class].filter(Boolean).join(' ');

  return (
    <div className={`npc-row ${npc.isResolved ? 'resolved' : ''} ${!npc.isAlive ? 'npc-dead' : ''}`}>
      <button
        className="resolve-btn"
        onClick={onToggleResolved}
        title={npc.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
        aria-label={npc.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
      >
        <Icon name={npc.isResolved ? 'check' : 'circle'} size={14} />
      </button>
      <div className="npc-row-content" role="button" tabIndex={0} aria-label={`Edit ${npc.title}`} onClick={() => startEditing(npc)} onKeyDown={onActivate(() => startEditing(npc))}>
        <div className="npc-row-header">
          <span className="item-title">
            {!npc.isAlive && <Icon name="skull" size={12} />}
            {' '}{npc.title}
          </span>
          <div className="npc-row-badges">
            <AlignmentBadge alignment={npc.alignment} size="small" />
            <AttitudeBadge attitude={npc.attitude} size="small" />
            <FactionBadge faction={faction} size="small" />
          </div>
        </div>
        {subtitle && (
          <div className="npc-row-meta">
            <span className="npc-row-subtitle">{subtitle}</span>
          </div>
        )}
      </div>
      <div className="item-actions">
        <button className="edit-btn" onClick={() => startEditing(npc)} title="Edit" aria-label="Edit">
          <Icon name="pencil" size={14} />
        </button>
        <button className="delete-btn" onClick={onDelete} title="Delete" aria-label="Delete">
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
}

function areEqual(prev: NpcRowProps, next: NpcRowProps) {
  return prev.npc === next.npc && prev.faction === next.faction;
}

export default memo(NpcRow, areEqual);
