import { ATTITUDE_INFO, type NpcAttitude } from '../../types/Campaign';

interface AttitudeBadgeProps {
  attitude?: NpcAttitude;
  size?: 'small' | 'normal';
}

function AttitudeBadge({ attitude, size = 'normal' }: AttitudeBadgeProps) {
  if (!attitude) return null;

  const info = ATTITUDE_INFO[attitude];

  return (
    <span
      className={`npc-badge attitude-badge ${size === 'small' ? 'npc-badge--small' : ''}`}
      style={{ backgroundColor: `${info.color}22`, color: info.color, borderColor: `${info.color}44` }}
    >
      {info.label}
    </span>
  );
}

export default AttitudeBadge;
