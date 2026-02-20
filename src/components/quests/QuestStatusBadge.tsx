import type { QuestStatus } from '../../types/Quest';
import { QUEST_STATUS_INFO } from '../../types/Quest';
import Icon from '../icons/Icon';

interface QuestStatusBadgeProps {
  status: QuestStatus;
  size?: 'small' | 'normal';
}

function QuestStatusBadge({ status, size = 'normal' }: QuestStatusBadgeProps) {
  const info = QUEST_STATUS_INFO[status];
  return (
    <span
      className={`quest-status-badge quest-status-badge--${status} ${size === 'small' ? 'quest-status-badge--small' : ''}`}
      style={{ backgroundColor: `${info.color}22`, color: info.color, borderColor: `${info.color}44` }}
    >
      <Icon name={info.icon} size={size === 'small' ? 10 : 12} />
      {info.label}
    </span>
  );
}

export default QuestStatusBadge;
