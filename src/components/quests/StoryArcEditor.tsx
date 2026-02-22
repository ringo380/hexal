import { useState } from 'react';
import type { StoryArc, StoryArcStatus, Quest } from '../../types/Quest';
import { STORY_ARC_STATUS_INFO, STORY_ARC_COLORS } from '../../types/Quest';
import QuestStatusBadge from './QuestStatusBadge';
import Icon from '../icons/Icon';

interface StoryArcEditorProps {
  arc: StoryArc;
  quests: Quest[];
  onUpdate: (updated: StoryArc) => void;
  onDelete: () => void;
}

function StoryArcEditor({ arc, quests, onUpdate, onDelete }: StoryArcEditorProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const update = (partial: Partial<StoryArc>) => {
    onUpdate({ ...arc, ...partial });
  };

  // Get quest objects for this arc's questIds
  const arcQuests = arc.questIds
    .map(id => quests.find(q => q.id === id))
    .filter((q): q is Quest => q !== undefined);

  // Available quests not in this arc
  const availableQuests = quests.filter(q => !arc.questIds.includes(q.id));

  const addQuest = (questId: string) => {
    if (!questId || arc.questIds.includes(questId)) return;
    update({ questIds: [...arc.questIds, questId] });
  };

  const removeQuest = (questId: string) => {
    update({ questIds: arc.questIds.filter(id => id !== questId) });
  };

  const moveQuest = (questId: string, direction: -1 | 1) => {
    const idx = arc.questIds.indexOf(questId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= arc.questIds.length) return;
    const ids = [...arc.questIds];
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    update({ questIds: ids });
  };

  return (
    <div className="story-arc-editor">
      {/* Title */}
      <div className="field-group">
        <input
          type="text"
          className="quest-title-input"
          value={arc.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Story arc title..."
        />
      </div>

      {/* Color */}
      <div className="field-group">
        <label>Color</label>
        <div className="story-arc-color-picker">
          {STORY_ARC_COLORS.map(c => (
            <button
              key={c}
              className={`story-arc-color-swatch ${arc.color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => update({ color: c })}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="field-group">
        <label>Status</label>
        <select
          value={arc.status}
          onChange={(e) => update({ status: e.target.value as StoryArcStatus })}
        >
          {(Object.keys(STORY_ARC_STATUS_INFO) as StoryArcStatus[]).map(s => (
            <option key={s} value={s}>{STORY_ARC_STATUS_INFO[s].label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="field-group">
        <label>Description</label>
        <textarea
          value={arc.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="Arc description..."
          rows={3}
        />
      </div>

      {/* DM Notes */}
      <div className="field-group">
        <label>DM Notes</label>
        <textarea
          value={arc.dmNotes}
          onChange={(e) => update({ dmNotes: e.target.value })}
          placeholder="Private DM notes..."
          rows={2}
        />
      </div>

      {/* Quests in arc */}
      <div className="field-group">
        <label>Quests ({arcQuests.length})</label>
        <div className="story-arc-quest-list">
          {arcQuests.map((q, idx) => (
            <div key={q.id} className="story-arc-quest-item">
              <span className="story-arc-quest-order">{idx + 1}</span>
              <span className="story-arc-quest-title">{q.title || 'Untitled'}</span>
              <QuestStatusBadge status={q.status} size="small" />
              <div className="story-arc-quest-actions">
                <button
                  className="btn-icon-small"
                  disabled={idx === 0}
                  onClick={() => moveQuest(q.id, -1)}
                  title="Move up"
                  aria-label="Move up"
                >
                  <Icon name="chevron-right" size={12} className="rotate-270" />
                </button>
                <button
                  className="btn-icon-small"
                  disabled={idx === arcQuests.length - 1}
                  onClick={() => moveQuest(q.id, 1)}
                  title="Move down"
                  aria-label="Move down"
                >
                  <Icon name="chevron-down" size={12} />
                </button>
                <button
                  className="btn-icon-small danger"
                  onClick={() => removeQuest(q.id)}
                  title="Remove from arc"
                  aria-label="Remove from arc"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            </div>
          ))}
          {arcQuests.length === 0 && (
            <div className="empty-hint">No quests in this arc</div>
          )}
        </div>
        {availableQuests.length > 0 && (
          <select value="" onChange={(e) => { if (e.target.value) addQuest(e.target.value); }}>
            <option value="">Add quest to arc...</option>
            {availableQuests.map(q => (
              <option key={q.id} value={q.id}>{q.title || 'Untitled'}</option>
            ))}
          </select>
        )}
      </div>

      {/* Visibility */}
      <div className="field-group">
        <label className="quest-visibility-label">
          <input
            type="checkbox"
            checked={arc.isVisibleToPlayers}
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
            <Icon name="trash" size={14} /> Delete Arc
          </button>
        ) : (
          <div className="quest-delete-confirm">
            <span>Delete "{arc.title || 'Untitled'}"?</span>
            <button className="btn btn-small btn-danger" onClick={onDelete}>Confirm</button>
            <button className="btn btn-small" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoryArcEditor;
