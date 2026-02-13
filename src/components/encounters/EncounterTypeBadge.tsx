import { ENCOUNTER_TYPE_INFO } from '../../types/Campaign';
import type { EncounterType } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface EncounterTypeBadgeProps {
  type: EncounterType;
  size?: 'small' | 'normal';
}

function EncounterTypeBadge({ type, size = 'normal' }: EncounterTypeBadgeProps) {
  const info = ENCOUNTER_TYPE_INFO[type];

  return (
    <span
      className={`encounter-type-badge ${size === 'small' ? 'encounter-type-badge--small' : ''}`}
      style={{ backgroundColor: `${info.color}22`, color: info.color, borderColor: `${info.color}44` }}
    >
      <Icon name={info.icon} size={size === 'small' ? 10 : 12} />
      {info.label}
    </span>
  );
}

export default EncounterTypeBadge;
