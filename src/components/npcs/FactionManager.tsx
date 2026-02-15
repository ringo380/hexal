import { useState } from 'react';
import type { Faction, NpcAlignment, Npc } from '../../types/Campaign';
import { FACTION_COLORS, ALIGNMENT_LABELS, createFaction } from '../../types/Campaign';
import Icon from '../icons/Icon';

const ALIGNMENTS: NpcAlignment[] = [
  'lawful-good', 'neutral-good', 'chaotic-good',
  'lawful-neutral', 'true-neutral', 'chaotic-neutral',
  'lawful-evil', 'neutral-evil', 'chaotic-evil',
  'unaligned'
];

interface FactionManagerProps {
  factions: Faction[];
  allNpcs: Array<{ npc: Npc; hexKey: string }>;
  onUpdate: (factions: Faction[]) => void;
}

function FactionManager({ factions, allNpcs, onUpdate }: FactionManagerProps) {
  const [selectedFactionId, setSelectedFactionId] = useState<string | null>(factions[0]?.id ?? null);

  const selectedFaction = factions.find(f => f.id === selectedFactionId) ?? null;

  const getMemberCount = (factionId: string): number => {
    return allNpcs.filter(({ npc }) => npc.factionId === factionId).length;
  };

  const handleAdd = () => {
    const usedColors = new Set(factions.map(f => f.color));
    const nextColor = FACTION_COLORS.find(c => !usedColors.has(c)) ?? FACTION_COLORS[0];
    const faction = createFaction('New Faction', nextColor);
    onUpdate([...factions, faction]);
    setSelectedFactionId(faction.id);
  };

  const handleDelete = (id: string) => {
    onUpdate(factions.filter(f => f.id !== id));
    if (selectedFactionId === id) {
      setSelectedFactionId(factions.find(f => f.id !== id)?.id ?? null);
    }
  };

  const handleUpdateFaction = (updates: Partial<Faction>) => {
    if (!selectedFactionId) return;
    onUpdate(factions.map(f => f.id === selectedFactionId ? { ...f, ...updates } : f));
  };

  return (
    <div className="faction-manager">
      <div className="faction-list-panel">
        <div className="panel-header">
          <h4>Factions</h4>
          <button className="btn btn-small btn-primary" onClick={handleAdd}>+ Add</button>
        </div>
        <div className="faction-list-items">
          {factions.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
              No factions yet
            </div>
          ) : (
            factions.map(faction => (
              <div
                key={faction.id}
                className={`faction-list-item ${faction.id === selectedFactionId ? 'selected' : ''}`}
                onClick={() => setSelectedFactionId(faction.id)}
              >
                <span className="faction-swatch" style={{ backgroundColor: faction.color }} />
                <span className="faction-name">{faction.name || 'Unnamed'}</span>
                <span className="faction-member-count">{getMemberCount(faction.id)}</span>
                <button
                  className="faction-delete-btn"
                  onClick={(e) => { e.stopPropagation(); handleDelete(faction.id); }}
                  title="Delete faction"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="faction-editor-panel">
        {selectedFaction ? (
          <FactionEditor
            faction={selectedFaction}
            memberCount={getMemberCount(selectedFaction.id)}
            onUpdate={handleUpdateFaction}
          />
        ) : (
          <div className="empty-state">
            <Icon name="shield" size={32} />
            <p>Select or create a faction to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface FactionEditorProps {
  faction: Faction;
  memberCount: number;
  onUpdate: (updates: Partial<Faction>) => void;
}

function FactionEditor({ faction, memberCount, onUpdate }: FactionEditorProps) {
  return (
    <div>
      <div className="field-group">
        <label>Name</label>
        <input
          type="text"
          value={faction.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Faction name"
          autoFocus
        />
      </div>

      <div className="field-group">
        <label>Color</label>
        <div className="faction-color-picker">
          {FACTION_COLORS.map(color => (
            <button
              key={color}
              className={`region-color-swatch ${faction.color === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onUpdate({ color })}
              title={color}
            />
          ))}
          <input
            type="color"
            className="region-color-custom"
            value={faction.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            title="Custom color"
          />
        </div>
      </div>

      <div className="field-group">
        <label>Alignment</label>
        <select
          value={faction.alignment ?? ''}
          onChange={(e) => onUpdate({ alignment: (e.target.value || undefined) as NpcAlignment | undefined })}
        >
          <option value="">None</option>
          {ALIGNMENTS.map(a => (
            <option key={a} value={a}>
              {ALIGNMENT_LABELS[a]} &mdash; {a.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label>Description</label>
        <textarea
          value={faction.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Describe this faction..."
          rows={3}
        />
      </div>

      <div className="field-group">
        <label>Goals</label>
        <textarea
          value={faction.goals ?? ''}
          onChange={(e) => onUpdate({ goals: e.target.value || undefined })}
          placeholder="What does this faction want?"
          rows={2}
        />
      </div>

      <div className="field-group">
        <label>Headquarters</label>
        <input
          type="text"
          value={faction.headquarters ?? ''}
          onChange={(e) => onUpdate({ headquarters: e.target.value || undefined })}
          placeholder="Base of operations"
        />
      </div>

      <div className="field-group">
        <label>Tags</label>
        <input
          type="text"
          value={faction.tags.join(', ')}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
            onUpdate({ tags });
          }}
          placeholder="Comma-separated tags"
        />
      </div>

      <div className="field-group">
        <div className="npc-alive-toggle">
          <input
            type="checkbox"
            id="faction-known"
            checked={faction.isKnownToPlayers}
            onChange={(e) => onUpdate({ isKnownToPlayers: e.target.checked })}
          />
          <label htmlFor="faction-known">Known to players</label>
        </div>
      </div>

      <div className="field-group">
        <label>Members: {memberCount}</label>
      </div>
    </div>
  );
}

export default FactionManager;
