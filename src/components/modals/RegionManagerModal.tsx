import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useSelection } from '../../stores/SelectionContext';
import type { Region } from '../../types/Campaign';
import { REGION_COLORS } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface RegionManagerModalProps {
  onClose: () => void;
}

function RegionManagerModal({ onClose }: RegionManagerModalProps) {
  const { regions, addRegion, updateRegion, deleteRegion } = useCampaign();
  const { setRegionPaintMode } = useSelection();
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(regions[0]?.id ?? null);

  const selectedRegion = regions.find(r => r.id === selectedRegionId) ?? null;

  const handleAddRegion = () => {
    // Pick the next unused color from the palette
    const usedColors = new Set(regions.map(r => r.color));
    const nextColor = REGION_COLORS.find(c => !usedColors.has(c)) ?? REGION_COLORS[0];
    const region = addRegion('New Region', nextColor);
    setSelectedRegionId(region.id);
  };

  const handleDeleteRegion = (id: string) => {
    deleteRegion(id);
    if (selectedRegionId === id) {
      setSelectedRegionId(regions.find(r => r.id !== id)?.id ?? null);
    }
  };

  const handleEnterPaintMode = () => {
    if (!selectedRegion) return;
    setRegionPaintMode(selectedRegion.id);
    onClose();
  };

  const handleClearHexes = () => {
    if (!selectedRegion) return;
    updateRegion(selectedRegion.id, { hexKeys: [] });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal region-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Icon name="map" size={18} /> Regions</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="region-manager-body">
          {/* Left panel: Region list */}
          <div className="region-list-panel">
            <div className="panel-header">
              <h4>Regions</h4>
              <button className="btn btn-small btn-primary" onClick={handleAddRegion}>
                + Add
              </button>
            </div>
            <div className="region-list-items">
              {regions.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                  No regions yet
                </div>
              ) : (
                regions.map(region => (
                  <div
                    key={region.id}
                    className={`region-list-item ${region.id === selectedRegionId ? 'selected' : ''}`}
                    onClick={() => setSelectedRegionId(region.id)}
                  >
                    <span className="region-swatch" style={{ backgroundColor: region.color }} />
                    <span className="region-name">{region.name || 'Unnamed'}</span>
                    <span className="region-hex-count">{region.hexKeys.length}</span>
                    <button
                      className="region-delete-btn"
                      onClick={(e) => { e.stopPropagation(); handleDeleteRegion(region.id); }}
                      title="Delete region"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right panel: Region editor */}
          <div className="region-editor-panel">
            {selectedRegion ? (
              <RegionEditor
                region={selectedRegion}
                onUpdate={(updates) => updateRegion(selectedRegion.id, updates)}
                onEnterPaintMode={handleEnterPaintMode}
                onClearHexes={handleClearHexes}
              />
            ) : (
              <div className="empty-state">
                <Icon name="map" size={32} />
                <p>Select or create a region to edit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RegionEditorProps {
  region: Region;
  onUpdate: (updates: Partial<Region>) => void;
  onEnterPaintMode: () => void;
  onClearHexes: () => void;
}

function RegionEditor({ region, onUpdate, onEnterPaintMode, onClearHexes }: RegionEditorProps) {
  return (
    <div>
      <div className="field-group">
        <label>Name</label>
        <input
          type="text"
          value={region.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="Region name"
          autoFocus
        />
      </div>

      <div className="field-group">
        <label>Color</label>
        <div className="region-color-picker">
          {REGION_COLORS.map(color => (
            <button
              key={color}
              className={`region-color-swatch ${region.color === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onUpdate({ color })}
              title={color}
            />
          ))}
          <input
            type="color"
            className="region-color-custom"
            value={region.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
            title="Custom color"
          />
        </div>
      </div>

      <div className="field-group">
        <label>Description</label>
        <textarea
          value={region.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Describe this region..."
          rows={3}
        />
      </div>

      <div className="field-group">
        <label>Notes</label>
        <textarea
          value={region.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="DM notes..."
          rows={2}
        />
      </div>

      <div className="field-group">
        <label>Tags</label>
        <input
          type="text"
          value={region.tags.join(', ')}
          onChange={(e) => {
            const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
            onUpdate({ tags });
          }}
          placeholder="Comma-separated tags"
        />
      </div>

      <div className="field-group">
        <div className="region-discovery-toggle">
          <input
            type="checkbox"
            id="region-discovered"
            checked={region.isDiscovered}
            onChange={(e) => onUpdate({ isDiscovered: e.target.checked })}
          />
          <label htmlFor="region-discovered">Discovered by players</label>
        </div>
      </div>

      <div className="field-group">
        <label>Hexes: {region.hexKeys.length}</label>
      </div>

      <div className="region-editor-actions">
        <button className="btn btn-primary" onClick={onEnterPaintMode}>
          <Icon name="pencil" size={14} /> Edit Hexes
        </button>
        {region.hexKeys.length > 0 && (
          <button className="btn btn-secondary" onClick={onClearHexes}>
            Clear All Hexes
          </button>
        )}
      </div>
    </div>
  );
}

export default RegionManagerModal;
