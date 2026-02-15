import { RELATIONSHIP_TYPE_INFO, type RelationshipType } from '../../types/Campaign';

interface RelationshipBadgeProps {
  type: RelationshipType;
  size?: 'small' | 'normal';
}

function RelationshipBadge({ type, size = 'normal' }: RelationshipBadgeProps) {
  const info = RELATIONSHIP_TYPE_INFO[type];

  return (
    <span
      className={`npc-badge relationship-badge ${size === 'small' ? 'npc-badge--small' : ''}`}
      style={{ backgroundColor: `${info.color}22`, color: info.color, borderColor: `${info.color}44` }}
    >
      {info.label}
    </span>
  );
}

export default RelationshipBadge;
