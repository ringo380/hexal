import type { Npc, Faction } from '../../types/Campaign';
import Icon from '../icons/Icon';
import AlignmentBadge from './AlignmentBadge';
import AttitudeBadge from './AttitudeBadge';
import FactionBadge from './FactionBadge';

interface NpcRowProps {
  npc: Npc;
  faction?: Faction;
  onToggleResolved: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function NpcRow({ npc, faction, onToggleResolved, onEdit, onDelete }: NpcRowProps) {
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
      <div className="npc-row-content" onClick={onEdit}>
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

export default NpcRow;
