import { memo } from 'react';
import type { Quest, StoryArc } from '../../types/Quest';
import QuestStatusBadge from './QuestStatusBadge';
import { onActivate } from '../../utils/keyboard';

interface QuestRowProps {
  quest: Quest;
  arc?: StoryArc;
  isSelected: boolean;
  onClick: () => void;
}

function QuestRow({ quest, arc, isSelected, onClick }: QuestRowProps) {
  const completedCount = quest.objectives.filter(o => o.isComplete).length;
  const totalCount = quest.objectives.length;

  return (
    <div
      className={`quest-row ${isSelected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={quest.title || 'Untitled Quest'}
      onClick={onClick}
      onKeyDown={onActivate(onClick)}
    >
      <div className="quest-row-header">
        {arc && (
          <span className="quest-row-arc-dot" style={{ backgroundColor: arc.color }} title={arc.title} />
        )}
        <span className="quest-row-title">{quest.title || 'Untitled Quest'}</span>
      </div>
      <div className="quest-row-meta">
        <QuestStatusBadge status={quest.status} size="small" />
        {totalCount > 0 && (
          <span className="quest-row-progress">{completedCount}/{totalCount}</span>
        )}
      </div>
    </div>
  );
}

function areEqual(prev: QuestRowProps, next: QuestRowProps) {
  return prev.quest === next.quest && prev.arc === next.arc && prev.isSelected === next.isSelected;
}

export default memo(QuestRow, areEqual);
