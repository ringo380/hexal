import { useState, useMemo } from 'react';
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
    campaign,
    addTerrainType,
    updateTerrainType,
    deleteTerrainType,
    renameTerrainType,
    updateCampaignData
  } = useCampaign();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const [selectedId, setSelectedId] = useState<string | null>(terrainTypes[0]?.id ?? null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [replacementId, setReplacementId] = useState<string>('');
  const [importDialog, setImportDialog] = useState<{ terrainTypes: TerrainType[]; count: number } | null>(null);

  const selectedTerrain = terrainTypes.find(t => t.id === selectedId) ?? null;

  // Group terrain types by category
  const groupedTerrains = useMemo(() => {
    const groups: Record<string, TerrainType[]> = {};
    for (const t of terrainTypes) {
      const cat = t.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    // Sort categories: named categories first, then Uncategorized
    const sorted = Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Uncategorized') return 1;
      if (b === 'Uncategorized') return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [terrainTypes]);

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
      isDefault: false,
      hazardLevel: 0,
      category: '',
      moisture: 2,
      temperature: 3
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

  const handleExport = async () => {
    if (!campaign) return;
    const data = { version: 1, name: campaign.name, terrainTypes };
    const defaultName = `${campaign.name.replace(/[^a-zA-Z0-9]/g, '-')}-terrains.json`;
    const filePath = await window.electronAPI.saveFileDialog(defaultName);
    if (!filePath) return;
    await window.electronAPI.saveFile(filePath, JSON.stringify(data, null, 2));
  };

  const handleImport = async () => {
    const filePath = await window.electronAPI.openFileDialog();
    if (!filePath) return;
    const result = await window.electronAPI.loadCampaign(filePath);
    if (!result.success || !result.campaign) return;
    const parsed = result.campaign as Record<string, unknown>;
    const imported = parsed.terrainTypes as TerrainType[] | undefined;
    if (!Array.isArray(imported) || imported.length === 0) return;
    // Validate minimum fields
    const valid = imported.every(t => t.name && t.colorHex && t.icon && typeof t.weight === 'number');
    if (!valid) return;
    setImportDialog({ terrainTypes: imported, count: imported.length });
  };

  const handleImportReplace = () => {
    if (!importDialog) return;
    updateCampaignData({ terrainTypes: importDialog.terrainTypes });
    setImportDialog(null);
    setSelectedId(importDialog.terrainTypes[0]?.id ?? null);
  };

  const handleImportMerge = () => {
    if (!importDialog) return;
    const existingNames = new Set(terrainTypes.map(t => t.name));
    const newTypes = importDialog.terrainTypes.filter(t => !existingNames.has(t.name));
    if (newTypes.length > 0) {
      updateCampaignData({ terrainTypes: [...terrainTypes, ...newTypes] });
    }
    setImportDialog(null);
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
              <div className="terrain-header-actions">
                <button className="btn btn-small btn-secondary" onClick={handleImport} title="Import terrain types from file">
                  Import
                </button>
                <button className="btn btn-small btn-secondary" onClick={handleExport} title="Export terrain types to file">
                  Export
                </button>
                <button className="btn btn-small btn-primary" onClick={handleAdd}>
                  + Add
                </button>
              </div>
            </div>
            <div className="terrain-list-items">
              {terrainTypes.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                  No terrain types
                </div>
              ) : (
                groupedTerrains.map(([category, types]) => (
                  <div key={category}>
                    {groupedTerrains.length > 1 && (
                      <div className="terrain-category-header">{category}</div>
                    )}
                    {types.map(terrain => (
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
                    ))}
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
                terrainTypes={terrainTypes}
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

        {/* Import merge dialog */}
        {importDialog && (
          <div className="terrain-import-dialog-overlay" onClick={() => setImportDialog(null)}>
            <div className="terrain-import-dialog" onClick={(e) => e.stopPropagation()}>
              <h4>Import Terrain Types</h4>
              <p>Found {importDialog.count} terrain type{importDialog.count !== 1 ? 's' : ''} in file.</p>
              <div className="terrain-import-dialog-actions">
                <button className="btn btn-secondary" onClick={() => setImportDialog(null)}>
                  Cancel
                </button>
                <button className="btn btn-secondary" onClick={handleImportMerge}>
                  Add New Only
                </button>
                <button className="btn btn-primary" onClick={handleImportReplace}>
                  Replace All
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
  terrainTypes: TerrainType[];
  onUpdate: (updates: Partial<TerrainType>) => void;
  onRename: (newName: string) => void;
}

function TerrainEditor({ terrain, terrainTypes, onUpdate, onRename }: TerrainEditorProps) {
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

  // Unique categories for datalist
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of terrainTypes) {
      if (t.category) set.add(t.category);
    }
    return Array.from(set).sort();
  }, [terrainTypes]);

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
        <label>Category</label>
        <input
          type="text"
          value={terrain.category ?? ''}
          onChange={(e) => onUpdate({ category: e.target.value })}
          placeholder="e.g. Temperate, Aquatic, Arctic"
          list="terrain-categories"
        />
        <datalist id="terrain-categories">
          {categories.map(c => <option key={c} value={c} />)}
        </datalist>
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

      <div className="field-group">
        <label>Moisture <span className="field-hint">(biome humidity 0-5)</span></label>
        <input
          type="number"
          min={0}
          max={5}
          value={terrain.moisture ?? 2}
          onChange={(e) => onUpdate({ moisture: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) })}
        />
      </div>

      <div className="field-group">
        <label>Temperature <span className="field-hint">(biome warmth 0-5)</span></label>
        <input
          type="number"
          min={0}
          max={5}
          value={terrain.temperature ?? 3}
          onChange={(e) => onUpdate({ temperature: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) })}
        />
      </div>

      <div className="field-group">
        <label>Hazard Level <span className="field-hint">(0=safe, 5=lethal)</span></label>
        <input
          type="number"
          min={0}
          max={5}
          value={terrain.hazardLevel ?? 0}
          onChange={(e) => onUpdate({ hazardLevel: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) })}
        />
      </div>

      {(terrain.hazardLevel ?? 0) > 0 && (
        <>
          <div className="field-group">
            <label>Hazard Type</label>
            <input
              type="text"
              value={terrain.hazardType ?? ''}
              onChange={(e) => onUpdate({ hazardType: e.target.value })}
              placeholder="e.g. Extreme Cold, Toxic Spores"
            />
          </div>

          <div className="field-group">
            <label>Hazard Description</label>
            <textarea
              value={terrain.hazardDescription ?? ''}
              onChange={(e) => onUpdate({ hazardDescription: e.target.value })}
              placeholder="Detailed hazard description for hex detail panel"
              rows={3}
            />
          </div>
        </>
      )}

      {terrain.isDefault && (
        <div className="terrain-default-notice">
          Built-in terrain type
        </div>
      )}
    </div>
  );
}

export default TerrainEditorModal;
