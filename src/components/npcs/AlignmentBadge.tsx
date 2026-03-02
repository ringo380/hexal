import { memo } from 'react';
import { ALIGNMENT_LABELS, ALIGNMENT_COLORS, type NpcAlignment } from '../../types/Campaign';

interface AlignmentBadgeProps {
  alignment?: NpcAlignment;
  size?: 'small' | 'normal';
}

function AlignmentBadge({ alignment, size = 'normal' }: AlignmentBadgeProps) {
  if (!alignment) return null;

  const color = ALIGNMENT_COLORS[alignment];
  const label = ALIGNMENT_LABELS[alignment];

  return (
    <span
      className={`npc-badge alignment-badge ${size === 'small' ? 'npc-badge--small' : ''}`}
      style={{ backgroundColor: `${color}22`, color, borderColor: `${color}44` }}
      title={alignment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
    >
      {label}
    </span>
  );
}

export default memo(AlignmentBadge);
