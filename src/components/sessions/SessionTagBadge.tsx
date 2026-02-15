import { SESSION_TAG_INFO, type SessionLogTag } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface SessionTagBadgeProps {
  tag: SessionLogTag;
  customTag?: string;
  size?: 'small' | 'normal';
}

function SessionTagBadge({ tag, customTag, size = 'normal' }: SessionTagBadgeProps) {
  const info = SESSION_TAG_INFO[tag];
  const label = tag === 'custom' && customTag ? customTag : info.label;

  return (
    <span
      className={`session-tag-badge ${size === 'small' ? 'session-tag-badge--small' : ''}`}
      style={{ backgroundColor: `${info.color}22`, color: info.color, borderColor: `${info.color}44` }}
    >
      <Icon name={info.icon} size={size === 'small' ? 10 : 12} />
      {label}
    </span>
  );
}

export default SessionTagBadge;
