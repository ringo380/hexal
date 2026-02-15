import type { Faction } from '../../types/Campaign';

interface FactionBadgeProps {
  faction?: Faction;
  size?: 'small' | 'normal';
}

function FactionBadge({ faction, size = 'normal' }: FactionBadgeProps) {
  if (!faction) return null;

  return (
    <span
      className={`npc-badge faction-badge ${size === 'small' ? 'npc-badge--small' : ''}`}
      style={{ backgroundColor: `${faction.color}22`, color: faction.color, borderColor: `${faction.color}44` }}
    >
      {faction.name}
    </span>
  );
}

export default FactionBadge;
