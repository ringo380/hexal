import { useState } from 'react';
import type { Quest, QuestStatus, QuestObjective, StoryArc } from '../../types/Quest';
import { QUEST_STATUS_INFO, createQuestObjective } from '../../types/Quest';
import type { Faction, Npc } from '../../types/Campaign';
import QuestStatusBadge from './QuestStatusBadge';
import Icon from '../icons/Icon';

interface QuestDetailPanelProps {
  quest: Quest;
  quests: Quest[];
  storyArcs: StoryArc[];
  factions: Faction[];
  allNpcs: Array<{ npc: Npc; hexKey: string }>;
  onUpdate: (updated: Quest) => void;
  onDelete: () => void;
}

function QuestDetailPanel({
  quest, quests, storyArcs, factions, allNpcs,
  onUpdate, onDelete
}: QuestDetailPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const update = (partial: Partial<Quest>) => {
    onUpdate({ ...quest, ...partial, modifiedAt: new Date().toISOString() });
  };

  // Objective management
  const addObjective = () => {
    const obj = createQuestObjective('');
    update({ objectives: [...quest.objectives, obj] });
  };

  const updateObjective = (id: string, changes: Partial<QuestObjective>) => {
    update({
      objectives: quest.objectives.map(o =>
        o.id === id ? { ...o, ...changes } : o
      )
    });
  };

  const removeObjective = (id: string) => {
    update({ objectives: quest.objectives.filter(o => o.id !== id) });
  };

  // Hex link management
  const addHexLink = (hexKey: string) => {
    if (!hexKey || quest.linkedHexKeys.includes(hexKey)) return;
    update({ linkedHexKeys: [...quest.linkedHexKeys, hexKey] });
  };

  const removeHexLink = (hexKey: string) => {
    update({ linkedHexKeys: quest.linkedHexKeys.filter(k => k !== hexKey) });
  };

  // NPC link management
  const addNpcLink = (npcId: string, hexKey: string) => {
    if (quest.linkedNpcRefs.some(r => r.npcId === npcId)) return;
    update({ linkedNpcRefs: [...quest.linkedNpcRefs, { npcId, hexKey }] });
  };

  const removeNpcLink = (npcId: string) => {
    update({ linkedNpcRefs: quest.linkedNpcRefs.filter(r => r.npcId !== npcId) });
  };

  // Faction link management
  const toggleFactionLink = (factionId: string) => {
    const linked = quest.linkedFactionIds.includes(factionId);
    update({
      linkedFactionIds: linked
        ? quest.linkedFactionIds.filter(id => id !== factionId)
        : [...quest.linkedFactionIds, factionId]
    });
  };

  // Prerequisite management
  const togglePrerequisite = (questId: string) => {
    const linked = quest.prerequisiteQuestIds.includes(questId);
    update({
      prerequisiteQuestIds: linked
        ? quest.prerequisiteQuestIds.filter(id => id !== questId)
        : [...quest.prerequisiteQuestIds, questId]
    });
  };

  const otherQuests = quests.filter(q => q.id !== quest.id);

  return (
    <div className="quest-detail-panel">
      {/* Title */}
      <div className="field-group">
        <input
          type="text"
          className="quest-title-input"
          value={quest.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Quest title..."
        />
      </div>

      {/* Status */}
      <div className="field-group">
        <label>Status</label>
        <div className="quest-status-select-row">
          {(Object.keys(QUEST_STATUS_INFO) as QuestStatus[]).map(s => (
            <button
              key={s}
              className={`quest-status-option ${quest.status === s ? 'active' : ''}`}
              style={quest.status === s ? { backgroundColor: `${QUEST_STATUS_INFO[s].color}22`, borderColor: QUEST_STATUS_INFO[s].color } : undefined}
              onClick={() => update({ status: s })}
            >
              <QuestStatusBadge status={s} size="small" />
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="field-group">
        <label>Description</label>
        <textarea
          value={quest.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Quest description visible to players..."
          rows={3}
        />
      </div>

      {/* DM Notes */}
      <div className="field-group">
        <label>DM Notes</label>
        <textarea
          value={quest.dmNotes}
          onChange={(e) => update({ dmNotes: e.target.value })}
          placeholder="Private DM notes..."
          rows={2}
        />
      </div>

      {/* Objectives */}
      <div className="field-group">
        <label>Objectives</label>
        <div className="quest-objectives-list">
          {quest.objectives.map((obj) => (
            <div key={obj.id} className="quest-objective-item">
              <input
                type="checkbox"
                checked={obj.isComplete}
                onChange={(e) => updateObjective(obj.id, { isComplete: e.target.checked })}
              />
              <input
                type="text"
                className="quest-objective-input"
                value={obj.description}
                onChange={(e) => updateObjective(obj.id, { description: e.target.value })}
                placeholder="Objective description..."
              />
              <label className="quest-objective-visibility" title="Visible to players">
                <input
                  type="checkbox"
                  checked={obj.isVisibleToPlayers}
                  onChange={(e) => updateObjective(obj.id, { isVisibleToPlayers: e.target.checked })}
                />
                <Icon name="eye" size={12} />
              </label>
              <button
                className="btn-icon-small danger"
                onClick={() => removeObjective(obj.id)}
                title="Remove objective"
              >
                <Icon name="trash" size={12} />
              </button>
            </div>
          ))}
          <button className="add-item-btn" onClick={addObjective}>+ Add Objective</button>
        </div>
      </div>

      {/* Linked Hexes */}
      <div className="field-group quest-links-section">
        <label>Linked Hexes</label>
        <div className="quest-link-chips">
          {quest.linkedHexKeys.map(hk => (
            <span key={hk} className="quest-link-chip">
              ({hk})
              <button className="chip-remove" onClick={() => removeHexLink(hk)}>&times;</button>
            </span>
          ))}
        </div>
        <HexKeyInput onAdd={addHexLink} />
      </div>

      {/* Linked NPCs */}
      <div className="field-group quest-links-section">
        <label>Linked NPCs</label>
        <div className="quest-link-chips">
          {quest.linkedNpcRefs.map(ref => {
            const entry = allNpcs.find(n => n.npc.id === ref.npcId);
            return (
              <span key={ref.npcId} className="quest-link-chip">
                {entry?.npc.title || ref.npcId}
                <button className="chip-remove" onClick={() => removeNpcLink(ref.npcId)}>&times;</button>
              </span>
            );
          })}
        </div>
        {allNpcs.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              const entry = allNpcs.find(n => n.npc.id === e.target.value);
              if (entry) addNpcLink(entry.npc.id, entry.hexKey);
            }}
          >
            <option value="">Add NPC...</option>
            {allNpcs
              .filter(n => !quest.linkedNpcRefs.some(r => r.npcId === n.npc.id))
              .map(n => (
                <option key={n.npc.id} value={n.npc.id}>{n.npc.title || 'Unnamed'} ({n.hexKey})</option>
              ))}
          </select>
        )}
      </div>

      {/* Linked Factions */}
      {factions.length > 0 && (
        <div className="field-group quest-links-section">
          <label>Linked Factions</label>
          <div className="quest-link-chips">
            {factions.filter(f => quest.linkedFactionIds.includes(f.id)).map(f => (
              <span key={f.id} className="quest-link-chip" style={{ borderColor: f.color }}>
                <span className="quest-row-arc-dot" style={{ backgroundColor: f.color }} />
                {f.name}
                <button className="chip-remove" onClick={() => toggleFactionLink(f.id)}>&times;</button>
              </span>
            ))}
          </div>
          <select value="" onChange={(e) => { if (e.target.value) toggleFactionLink(e.target.value); }}>
            <option value="">Add faction...</option>
            {factions.filter(f => !quest.linkedFactionIds.includes(f.id)).map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Story Arc */}
      <div className="field-group">
        <label>Story Arc</label>
        <select
          value={quest.storyArcId || ''}
          onChange={(e) => update({ storyArcId: e.target.value || undefined })}
        >
          <option value="">None</option>
          {storyArcs.map(arc => (
            <option key={arc.id} value={arc.id}>{arc.title || 'Untitled Arc'}</option>
          ))}
        </select>
      </div>

      {/* Prerequisites */}
      {otherQuests.length > 0 && (
        <div className="field-group quest-links-section">
          <label>Prerequisites</label>
          <div className="quest-link-chips">
            {quest.prerequisiteQuestIds.map(id => {
              const prereq = quests.find(q => q.id === id);
              return (
                <span key={id} className="quest-link-chip">
                  {prereq?.title || id}
                  <button className="chip-remove" onClick={() => togglePrerequisite(id)}>&times;</button>
                </span>
              );
            })}
          </div>
          <select value="" onChange={(e) => { if (e.target.value) togglePrerequisite(e.target.value); }}>
            <option value="">Add prerequisite...</option>
            {otherQuests.filter(q => !quest.prerequisiteQuestIds.includes(q.id)).map(q => (
              <option key={q.id} value={q.id}>{q.title || 'Untitled'}</option>
            ))}
          </select>
        </div>
      )}

      {/* Extra fields row */}
      <div className="quest-extra-fields">
        <div className="field-group field-group-inline">
          <label>Difficulty</label>
          <input
            type="text"
            value={quest.difficulty || ''}
            onChange={(e) => update({ difficulty: e.target.value || undefined })}
            placeholder="e.g., Hard"
          />
        </div>
        <div className="field-group field-group-inline">
          <label>Est. Sessions</label>
          <input
            type="number"
            min="0"
            value={quest.estimatedSessions ?? ''}
            onChange={(e) => update({ estimatedSessions: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          />
        </div>
        <div className="field-group field-group-inline">
          <label>XP Reward</label>
          <input
            type="number"
            min="0"
            value={quest.xpReward ?? ''}
            onChange={(e) => update({ xpReward: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="field-group">
        <label>Tags</label>
        <input
          type="text"
          value={quest.tags.join(', ')}
          onChange={(e) => update({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
          placeholder="Comma-separated tags"
        />
      </div>

      {/* Visibility */}
      <div className="field-group">
        <label className="quest-visibility-label">
          <input
            type="checkbox"
            checked={quest.isVisibleToPlayers}
            onChange={(e) => update({ isVisibleToPlayers: e.target.checked })}
          />
          <Icon name="eye" size={14} />
          Visible to players
        </label>
      </div>

      {/* Delete */}
      <div className="quest-danger-zone">
        {!showDeleteConfirm ? (
          <button className="btn btn-small btn-danger" onClick={() => setShowDeleteConfirm(true)}>
            <Icon name="trash" size={14} /> Delete Quest
          </button>
        ) : (
          <div className="quest-delete-confirm">
            <span>Delete "{quest.title || 'Untitled'}"?</span>
            <button className="btn btn-small btn-danger" onClick={onDelete}>Confirm</button>
            <button className="btn btn-small" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Small helper for hex key input
function HexKeyInput({ onAdd }: { onAdd: (hexKey: string) => void }) {
  const [value, setValue] = useState('');
  const handleAdd = () => {
    const trimmed = value.trim();
    if (/^\d+,\d+$/.test(trimmed)) {
      onAdd(trimmed);
      setValue('');
    }
  };
  return (
    <div className="hex-key-input-row">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        placeholder="q,r (e.g., 3,5)"
      />
      <button className="btn btn-small" onClick={handleAdd}>Add</button>
    </div>
  );
}

export default QuestDetailPanel;
