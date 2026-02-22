import { useState } from 'react';
import type { SessionLogEntry, SessionLogTag } from '../../types/Campaign';
import { SESSION_TAG_INFO, parseHexKey } from '../../types/Campaign';
import type { CalendarSystem } from '../../types/Weather';
import { formatDate, formatTime12 } from '../../services/time';
import Icon from '../icons/Icon';

interface SessionEntryEditorProps {
  entry: SessionLogEntry;
  calendar?: CalendarSystem;
  onChange: (updated: SessionLogEntry) => void;
  onDelete: () => void;
  onNavigateToHex?: (hexKey: string) => void;
}

const ALL_TAGS: SessionLogTag[] = ['combat', 'discovery', 'social', 'quest', 'travel', 'rest', 'shopping', 'custom'];

function SessionEntryEditor({ entry, calendar, onChange, onDelete, onNavigateToHex }: SessionEntryEditorProps) {
  const [hexInput, setHexInput] = useState('');

  const toggleTag = (tag: SessionLogTag) => {
    const tags = entry.tags.includes(tag)
      ? entry.tags.filter(t => t !== tag)
      : [...entry.tags, tag];
    onChange({ ...entry, tags });
  };

  const addHexKey = () => {
    const trimmed = hexInput.trim();
    if (!trimmed) return;
    const parsed = parseHexKey(trimmed);
    if (!parsed) return;
    const key = `${parsed.q},${parsed.r}`;
    if (entry.hexKeys.includes(key)) return;
    onChange({ ...entry, hexKeys: [...entry.hexKeys, key] });
    setHexInput('');
  };

  const removeHexKey = (key: string) => {
    onChange({ ...entry, hexKeys: entry.hexKeys.filter(k => k !== key) });
  };

  const timeDisplay = calendar
    ? `${formatDate(calendar, entry.inGameTime)} ${formatTime12(entry.inGameTime)}`
    : `Y${entry.inGameTime.year} M${entry.inGameTime.month + 1} D${entry.inGameTime.day} ${entry.inGameTime.hour}:${String(entry.inGameTime.minute).padStart(2, '0')}`;

  return (
    <div className="session-entry-editor">
      <div className="session-entry-editor-header">
        <span className="session-entry-time">
          <Icon name="clock" size={12} /> {timeDisplay}
        </span>
        <button className="btn-icon-small danger" onClick={onDelete} title="Delete entry" aria-label="Delete entry">
          <Icon name="trash" size={14} />
        </button>
      </div>

      <input
        type="text"
        className="session-entry-title-input"
        placeholder="Entry title..."
        value={entry.title}
        onChange={(e) => onChange({ ...entry, title: e.target.value })}
      />

      <textarea
        className="session-entry-description-input"
        placeholder="Description..."
        value={entry.description}
        onChange={(e) => onChange({ ...entry, description: e.target.value })}
        rows={2}
      />

      <div className="session-entry-tags">
        {ALL_TAGS.map(tag => (
          <button
            key={tag}
            className={`tag-filter-chip ${entry.tags.includes(tag) ? 'active' : ''}`}
            style={entry.tags.includes(tag) ? {
              backgroundColor: `${SESSION_TAG_INFO[tag].color}22`,
              color: SESSION_TAG_INFO[tag].color,
              borderColor: `${SESSION_TAG_INFO[tag].color}44`
            } : undefined}
            onClick={() => toggleTag(tag)}
          >
            <Icon name={SESSION_TAG_INFO[tag].icon} size={10} />
            {SESSION_TAG_INFO[tag].label}
          </button>
        ))}
      </div>

      {entry.tags.includes('custom') && (
        <input
          type="text"
          placeholder="Custom tag name..."
          value={entry.customTag || ''}
          onChange={(e) => onChange({ ...entry, customTag: e.target.value })}
          style={{ marginTop: '4px', fontSize: '12px' }}
        />
      )}

      <div className="session-entry-hexes">
        <div className="session-entry-hex-chips">
          {entry.hexKeys.map(key => (
            <span key={key} className="hex-link-chip" onClick={() => onNavigateToHex?.(key)}>
              ({key})
              <button
                className="hex-link-chip-remove"
                onClick={(e) => { e.stopPropagation(); removeHexKey(key); }}
                aria-label={`Remove hex ${key}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="session-entry-hex-add">
          <input
            type="text"
            placeholder="q,r"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addHexKey(); }}
            style={{ width: '60px', fontSize: '12px' }}
          />
          <button className="btn btn-small" onClick={addHexKey}>+ Hex</button>
        </div>
      </div>

      <label className="checkbox-label" style={{ fontSize: '12px', marginTop: '4px' }}>
        <input
          type="checkbox"
          checked={entry.isVisibleToPlayers}
          onChange={(e) => onChange({ ...entry, isVisibleToPlayers: e.target.checked })}
        />
        Visible to Players
      </label>
    </div>
  );
}

export default SessionEntryEditor;
