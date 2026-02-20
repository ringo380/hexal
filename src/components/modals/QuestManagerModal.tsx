import { useState, useMemo } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import type { Quest, QuestStatus, StoryArc } from '../../types/Quest';
import { createQuest, createStoryArc, QUEST_STATUS_INFO, STORY_ARC_STATUS_INFO, STORY_ARC_COLORS } from '../../types/Quest';
import { deleteQuestCleanup, deleteStoryArcCleanup } from '../../services/questService';
import QuestRow from '../quests/QuestRow';
import QuestDetailPanel from '../quests/QuestDetailPanel';
import StoryArcEditor from '../quests/StoryArcEditor';
import QuestGraph from '../quests/QuestGraph';
import Icon from '../icons/Icon';

interface QuestManagerModalProps {
  onClose: () => void;
}

type Tab = 'quests' | 'arcs' | 'graph';

// Status sort order: active first, then rumored, unknown, completed, failed, abandoned
const STATUS_ORDER: Record<QuestStatus, number> = {
  active: 0,
  rumored: 1,
  unknown: 2,
  completed: 3,
  failed: 4,
  abandoned: 5
};

function QuestManagerModal({ onClose }: QuestManagerModalProps) {
  const { campaign, quests, storyArcs, factions, allNpcs, updateCampaignData } = useCampaign();
  const [activeTab, setActiveTab] = useState<Tab>('quests');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<QuestStatus | ''>('');
  const [filterArc, setFilterArc] = useState<string>('');
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);

  // Filtered and sorted quests
  const filteredQuests = useMemo(() => {
    let result = [...quests];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(quest =>
        quest.title.toLowerCase().includes(q) ||
        quest.description.toLowerCase().includes(q) ||
        quest.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (filterStatus) {
      result = result.filter(quest => quest.status === filterStatus);
    }

    if (filterArc) {
      result = result.filter(quest => quest.storyArcId === filterArc);
    }

    result.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
    return result;
  }, [quests, searchQuery, filterStatus, filterArc]);

  const selectedQuest = selectedQuestId ? quests.find(q => q.id === selectedQuestId) : null;
  const selectedArc = selectedArcId ? storyArcs.find(a => a.id === selectedArcId) : null;

  const getArcForQuest = (quest: Quest): StoryArc | undefined => {
    if (!quest.storyArcId) return undefined;
    return storyArcs.find(a => a.id === quest.storyArcId);
  };

  // Quest CRUD
  const handleAddQuest = () => {
    const quest = createQuest('New Quest');
    updateCampaignData({ quests: [...quests, quest] });
    setSelectedQuestId(quest.id);
  };

  const handleUpdateQuest = (updated: Quest) => {
    // Also sync storyArc membership: if storyArcId changed, update arc questIds
    const original = quests.find(q => q.id === updated.id);
    let updatedArcs = storyArcs;

    if (original && original.storyArcId !== updated.storyArcId) {
      updatedArcs = storyArcs.map(arc => {
        // Remove from old arc
        if (arc.id === original.storyArcId && arc.questIds.includes(updated.id)) {
          return { ...arc, questIds: arc.questIds.filter(id => id !== updated.id) };
        }
        // Add to new arc
        if (arc.id === updated.storyArcId && !arc.questIds.includes(updated.id)) {
          return { ...arc, questIds: [...arc.questIds, updated.id] };
        }
        return arc;
      });
    }

    updateCampaignData({
      quests: quests.map(q => q.id === updated.id ? updated : q),
      storyArcs: updatedArcs
    });
  };

  const handleDeleteQuest = (questId: string) => {
    if (!campaign) return;
    const cleanup = deleteQuestCleanup(campaign, questId);
    updateCampaignData(cleanup);
    setSelectedQuestId(null);
  };

  // Story Arc CRUD
  const handleAddArc = () => {
    const usedColors = new Set(storyArcs.map(a => a.color));
    const nextColor = STORY_ARC_COLORS.find(c => !usedColors.has(c)) || STORY_ARC_COLORS[0];
    const arc = createStoryArc('New Story Arc', nextColor);
    updateCampaignData({ storyArcs: [...storyArcs, arc] });
    setSelectedArcId(arc.id);
  };

  const handleUpdateArc = (updated: StoryArc) => {
    // Sync quests: set storyArcId on member quests, clear from removed quests
    const oldArc = storyArcs.find(a => a.id === updated.id);
    const oldQuestIds = new Set(oldArc?.questIds ?? []);
    const newQuestIds = new Set(updated.questIds);

    const updatedQuests = quests.map(q => {
      if (newQuestIds.has(q.id) && q.storyArcId !== updated.id) {
        return { ...q, storyArcId: updated.id };
      }
      if (oldQuestIds.has(q.id) && !newQuestIds.has(q.id) && q.storyArcId === updated.id) {
        return { ...q, storyArcId: undefined };
      }
      return q;
    });

    updateCampaignData({
      storyArcs: storyArcs.map(a => a.id === updated.id ? updated : a),
      quests: updatedQuests
    });
  };

  const handleDeleteArc = (arcId: string) => {
    if (!campaign) return;
    const cleanup = deleteStoryArcCleanup(campaign, arcId);
    updateCampaignData(cleanup);
    setSelectedArcId(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal quest-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Icon name="star" size={18} /> Quests & Story Arcs</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'quests' ? 'active' : ''}`}
            onClick={() => setActiveTab('quests')}
          >
            <Icon name="star" size={14} /> Quests ({quests.length})
          </button>
          <button
            className={`modal-tab ${activeTab === 'arcs' ? 'active' : ''}`}
            onClick={() => setActiveTab('arcs')}
          >
            <Icon name="link" size={14} /> Story Arcs ({storyArcs.length})
          </button>
          <button
            className={`modal-tab ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            <Icon name="map" size={14} /> Graph
          </button>
        </div>

        {/* Quest Tab */}
        {activeTab === 'quests' && (
          <div className="quest-manager-content">
            <div className="quest-list-panel">
              {/* Search & filters */}
              <div className="quest-list-controls">
                <input
                  type="text"
                  className="quest-search-input"
                  placeholder="Search quests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="quest-filter-row">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as QuestStatus | '')}
                  >
                    <option value="">All Statuses</option>
                    {(Object.keys(QUEST_STATUS_INFO) as QuestStatus[]).map(s => (
                      <option key={s} value={s}>{QUEST_STATUS_INFO[s].label}</option>
                    ))}
                  </select>
                  {storyArcs.length > 0 && (
                    <select
                      value={filterArc}
                      onChange={(e) => setFilterArc(e.target.value)}
                    >
                      <option value="">All Arcs</option>
                      {storyArcs.map(a => (
                        <option key={a.id} value={a.id}>{a.title || 'Untitled'}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Quest list */}
              <div className="quest-list-scroll">
                {filteredQuests.map(quest => (
                  <QuestRow
                    key={quest.id}
                    quest={quest}
                    arc={getArcForQuest(quest)}
                    isSelected={quest.id === selectedQuestId}
                    onClick={() => setSelectedQuestId(quest.id)}
                  />
                ))}
                {filteredQuests.length === 0 && (
                  <div className="quest-list-empty">
                    {quests.length === 0 ? 'No quests yet' : 'No matching quests'}
                  </div>
                )}
              </div>

              <button className="btn btn-primary quest-add-btn" onClick={handleAddQuest}>
                + New Quest
              </button>
            </div>

            {/* Detail panel */}
            <div className="quest-detail-scroll">
              {selectedQuest ? (
                <QuestDetailPanel
                  quest={selectedQuest}
                  quests={quests}
                  storyArcs={storyArcs}
                  factions={factions}
                  allNpcs={allNpcs}
                  onUpdate={handleUpdateQuest}
                  onDelete={() => handleDeleteQuest(selectedQuest.id)}
                />
              ) : (
                <div className="quest-detail-empty">
                  <Icon name="star" size={32} />
                  <p>Select a quest to edit</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Graph Tab */}
        {activeTab === 'graph' && (
          <div className="quest-manager-content" style={{ height: '100%' }}>
            <QuestGraph
              quests={quests}
              storyArcs={storyArcs}
              selectedQuestId={selectedQuestId}
              onSelectQuest={(id) => {
                setSelectedQuestId(id);
                setActiveTab('quests');
              }}
            />
          </div>
        )}

        {/* Story Arcs Tab */}
        {activeTab === 'arcs' && (
          <div className="quest-manager-content">
            <div className="quest-list-panel">
              <div className="quest-list-scroll">
                {storyArcs.map(arc => {
                  const questCount = arc.questIds.length;
                  return (
                    <div
                      key={arc.id}
                      className={`quest-row ${arc.id === selectedArcId ? 'selected' : ''}`}
                      onClick={() => setSelectedArcId(arc.id)}
                    >
                      <div className="quest-row-header">
                        <span className="quest-row-arc-dot" style={{ backgroundColor: arc.color }} />
                        <span className="quest-row-title">{arc.title || 'Untitled Arc'}</span>
                      </div>
                      <div className="quest-row-meta">
                        <span className="quest-row-progress">{questCount} quest{questCount !== 1 ? 's' : ''}</span>
                        <span className="quest-status-badge quest-status-badge--small" style={{
                          backgroundColor: `${STORY_ARC_STATUS_INFO[arc.status].color}22`,
                          color: STORY_ARC_STATUS_INFO[arc.status].color,
                          borderColor: `${STORY_ARC_STATUS_INFO[arc.status].color}44`
                        }}>
                          {STORY_ARC_STATUS_INFO[arc.status].label}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {storyArcs.length === 0 && (
                  <div className="quest-list-empty">No story arcs yet</div>
                )}
              </div>
              <button className="btn btn-primary quest-add-btn" onClick={handleAddArc}>
                + New Story Arc
              </button>
            </div>

            <div className="quest-detail-scroll">
              {selectedArc ? (
                <StoryArcEditor
                  arc={selectedArc}
                  quests={quests}
                  onUpdate={handleUpdateArc}
                  onDelete={() => handleDeleteArc(selectedArc.id)}
                />
              ) : (
                <div className="quest-detail-empty">
                  <Icon name="link" size={32} />
                  <p>Select a story arc to edit</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestManagerModal;
