import { memo } from 'react';
import { OUTCOME_INFO } from '../../types/Campaign';
import type { EncounterOutcome } from '../../types/Campaign';

interface OutcomeBadgeProps {
  outcome: EncounterOutcome;
  size?: 'small' | 'normal';
}

function OutcomeBadge({ outcome, size = 'normal' }: OutcomeBadgeProps) {
  if (outcome === 'pending') return null;

  const info = OUTCOME_INFO[outcome];

  return (
    <span
      className={`outcome-badge ${size === 'small' ? 'outcome-badge--small' : ''}`}
      style={{ backgroundColor: `${info.color}22`, color: info.color, borderColor: `${info.color}44` }}
      title={`Outcome: ${info.label}`}
    >
      {info.label}
    </span>
  );
}

export default memo(OutcomeBadge);
