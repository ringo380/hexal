// PlayerQuestLog - Read-only quest log for the player view

import { useState } from 'react';
import type { PlayerCampaign, PlayerQuest, PlayerStoryArc } from '../../services/playerViewFilter';
import QuestStatusBadge from '../quests/QuestStatusBadge';

interface PlayerQuestLogProps {
  campaign: PlayerCampaign;
}

type StatusFilter = 'all' | 'active' | 'completed';

function PlayerQuestLog({ campaign }: PlayerQuestLogProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filteredQuests = campaign.quests.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'active') return q.status === 'active' || q.status === 'rumored';
    if (filter === 'completed') return q.status === 'completed';
    return true;
  });

  // Build a map of storyArcId -> arc for quick lookup
  const arcMap = new Map<string, PlayerStoryArc>();
  for (const arc of campaign.storyArcs) {
    arcMap.set(arc.id, arc);
  }

  // Group quests by story arc
  const arcGroups = new Map<string, { arc: PlayerStoryArc; quests: PlayerQuest[] }>();
  const ungroupedQuests: PlayerQuest[] = [];

  for (const quest of filteredQuests) {
    if (quest.storyArcId && arcMap.has(quest.storyArcId)) {
      const arc = arcMap.get(quest.storyArcId)!;
      if (!arcGroups.has(arc.id)) {
        arcGroups.set(arc.id, { arc, quests: [] });
      }
      arcGroups.get(arc.id)!.quests.push(quest);
    } else {
      ungroupedQuests.push(quest);
    }
  }

  return (
    <div className="player-quest-log">
      <div className="player-quest-log-header">
        <h3>Quest Log</h3>
        <select
          className="player-quest-log-filter"
          value={filter}
          onChange={e => setFilter(e.target.value as StatusFilter)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Story arc groups */}
      {Array.from(arcGroups.values()).map(({ arc, quests }) => (
        <div key={arc.id} className="player-quest-arc-group">
          <div className="player-quest-arc-title">
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: arc.color
              }}
            />
            {arc.title}
          </div>
          {quests.map(quest => (
            <QuestItem key={quest.id} quest={quest} />
          ))}
        </div>
      ))}

      {/* Ungrouped quests */}
      {ungroupedQuests.map(quest => (
        <QuestItem key={quest.id} quest={quest} />
      ))}

      {filteredQuests.length === 0 && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '8px 0' }}>
          No quests match the current filter.
        </div>
      )}
    </div>
  );
}

function QuestItem({ quest }: { quest: PlayerQuest }) {
  return (
    <div className="player-quest-item">
      <div className="player-quest-item-header">
        <QuestStatusBadge status={quest.status} size="small" />
        <span className="player-quest-item-title">{quest.title}</span>
      </div>
      {quest.description && (
        <div className="player-quest-item-desc">{quest.description}</div>
      )}
      {quest.objectives.length > 0 && (
        <div className="player-quest-objectives">
          {quest.objectives.map(obj => (
            <div
              key={obj.id}
              className={`player-quest-objective${obj.isComplete ? ' complete' : ''}`}
            >
              <span>{obj.isComplete ? '\u2611' : '\u2610'}</span>
              {obj.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PlayerQuestLog;
