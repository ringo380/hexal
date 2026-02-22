import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { TerrainType } from '../../types/Campaign';
import { REGION_COLORS } from '../../types/Campaign';
import Icon from '../icons/Icon';
import type { IconName } from '../icons/Icon';

// Icons suitable for terrain types
const TERRAIN_ICON_OPTIONS: IconName[] = [
  'leaf', 'tree', 'triangle', 'mountain', 'drop', 'water',
  'sun', 'snowflake', 'wind', 'flower', 'cloud', 'moon',
  'star', 'hexagon', 'shield', 'skull', 'sparkle', 'pin'
];

// Color palette for terrain types
const TERRAIN_COLORS = [
  '#90EE90', '#228B22', '#DEB887', '#A0A0A0', '#556B2F',
  '#F4A460', '#87CEEB', '#006400', '#E0FFFF', '#7CFC00',
  ...REGION_COLORS
];

interface TerrainEditorModalProps {
  onClose: () => void;
}

function TerrainEditorModal({ onClose }: TerrainEditorModalProps) {
  const {
    terrainTypes,
    addTerrainType,
    updateTerrainType,
    deleteTerrainType,
    renameTerrainType
  } = useCampaign();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const [selectedId, setSelectedId] = useState<string | null>(terrainTypes[0]?.id ?? null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [replacementId, setReplacementId] = useState<string>('');

  const selectedTerrain = terrainTypes.find(t => t.id === selectedId) ?? null;

  const handleAdd = () => {
    const usedColors = new Set(terrainTypes.map(t => t.colorHex));
    const nextColor = TERRAIN_COLORS.find(c => !usedColors.has(c)) ?? TERRAIN_COLORS[0];
    const terrain: TerrainType = {
      id: crypto.randomUUID(),
      name: 'New Terrain',
      colorHex: nextColor,
      icon: 'hexagon',
      weight: 1,
      moveCost: 1,
      elevation: 1,
      isDefault: false
    };
    addTerrainType(terrain);
    setSelectedId(terrain.id);
  };

  const handleDeleteClick = (id: string) => {
    const others = terrainTypes.filter(t => t.id !== id);
    if (others.length === 0) return; // Can't delete the last terrain
    setDeleteConfirmId(id);
    setReplacementId(others[0].id);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId || !replacementId) return;
    const replacement = terrainTypes.find(t => t.id === replacementId);
    if (!replacement) return;
    deleteTerrainType(deleteConfirmId, replacement.name);
    if (selectedId === deleteConfirmId) {
      setSelectedId(terrainTypes.find(t => t.id !== deleteConfirmId)?.id ?? null);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="terrain-editor-modal-title">
      <div className="modal terrain-editor-modal" ref={focusTrapRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="terrain-editor-modal-title"><Icon name="hexagon" size={18} /> Terrain Types</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="terrain-editor-body">
          {/* Left panel: Terrain list */}
          <div className="terrain-list-panel">
            <div className="panel-header">
              <h4>Types</h4>
              <button className="btn btn-small btn-primary" onClick={handleAdd}>
                + Add
              </button>
            </div>
            <div className="terrain-list-items">
              {terrainTypes.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                  No terrain types
                </div>
              ) : (
                terrainTypes.map(terrain => (
                  <div
                    key={terrain.id}
                    className={`terrain-list-item ${terrain.id === selectedId ? 'selected' : ''}`}
                    onClick={() => setSelectedId(terrain.id)}
                  >
                    <span className="terrain-swatch" style={{ backgroundColor: terrain.colorHex }} />
                    <Icon name={terrain.icon as IconName} size={14} />
                    <span className="terrain-name">{terrain.name || 'Unnamed'}</span>
                    {terrain.isDefault && (
                      <span className="terrain-badge">default</span>
                    )}
                    {!terrain.isDefault && terrainTypes.length > 1 && (
                      <button
                        className="terrain-delete-btn"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(terrain.id); }}
                        title="Delete terrain type"
                        aria-label="Delete terrain type"
                      >
                        <Icon name="trash" size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Terrain editor */}
          <div className="terrain-editor-panel">
            {selectedTerrain ? (
              <TerrainEditor
                terrain={selectedTerrain}
                onUpdate={(updates) => updateTerrainType(selectedTerrain.id, updates)}
                onRename={(newName) => renameTerrainType(selectedTerrain.id, newName)}
              />
            ) : (
              <div className="empty-state">
                <Icon name="hexagon" size={32} />
                <p>Select or create a terrain type to edit</p>
              </div>
            )}
          </div>
        </div>

        {/* Delete confirmation dialog */}
        {deleteConfirmId && (
          <div className="terrain-delete-dialog-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="terrain-delete-dialog" onClick={(e) => e.stopPropagation()}>
              <h4>Delete Terrain Type</h4>
              <p>Reassign all hexes with this terrain to:</p>
              <select
                value={replacementId}
                onChange={(e) => setReplacementId(e.target.value)}
              >
                {terrainTypes
                  .filter(t => t.id !== deleteConfirmId)
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))
                }
              </select>
              <div className="terrain-delete-dialog-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TerrainEditorProps {
  terrain: TerrainType;
  onUpdate: (updates: Partial<TerrainType>) => void;
  onRename: (newName: string) => void;
}

function TerrainEditor({ terrain, onUpdate, onRename }: TerrainEditorProps) {
  const [editName, setEditName] = useState(terrain.name);
  const [nameKey, setNameKey] = useState(terrain.id);

  // Reset local name when selection changes
  if (nameKey !== terrain.id) {
    setEditName(terrain.name);
    setNameKey(terrain.id);
  }

  const handleNameBlur = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== terrain.name) {
      onRename(trimmed);
    } else {
      setEditName(terrain.name);
    }
  };

  return (
    <div>
      <div className="field-group">
        <label>Name</label>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="Terrain name"
        />
      </div>

      <div className="field-group">
        <label>Color</label>
        <div className="terrain-color-picker">
          {TERRAIN_COLORS.map(color => (
            <button
              key={color}
              className={`terrain-color-swatch ${terrain.colorHex === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onUpdate({ colorHex: color })}
              title={color}
              aria-label={`Color ${color}`}
            />
          ))}
          <input
            type="color"
            className="terrain-color-custom"
            value={terrain.colorHex}
            onChange={(e) => onUpdate({ colorHex: e.target.value })}
            title="Custom color"
          />
        </div>
      </div>

      <div className="field-group">
        <label>Icon</label>
        <div className="terrain-icon-picker">
          {TERRAIN_ICON_OPTIONS.map(iconName => (
            <button
              key={iconName}
              className={`terrain-icon-option ${terrain.icon === iconName ? 'selected' : ''}`}
              onClick={() => onUpdate({ icon: iconName })}
              title={iconName}
              aria-label={`Icon ${iconName}`}
            >
              <Icon name={iconName} size={16} />
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label>Generation Weight <span className="field-hint">(frequency 1-10)</span></label>
        <input
          type="number"
          min={1}
          max={10}
          value={terrain.weight}
          onChange={(e) => onUpdate({ weight: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
        />
      </div>

      <div className="field-group">
        <label>Movement Cost <span className="field-hint">(road pathfinding 1-5)</span></label>
        <input
          type="number"
          min={1}
          max={5}
          value={terrain.moveCost ?? 1}
          onChange={(e) => onUpdate({ moveCost: Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) })}
        />
      </div>

      <div className="field-group">
        <label>Elevation <span className="field-hint">(river flow 0-5)</span></label>
        <input
          type="number"
          min={0}
          max={5}
          value={terrain.elevation ?? 1}
          onChange={(e) => onUpdate({ elevation: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) })}
        />
      </div>

      {terrain.isDefault && (
        <div className="terrain-default-notice">
          Built-in terrain type
        </div>
      )}
    </div>
  );
}

export default TerrainEditorModal;
