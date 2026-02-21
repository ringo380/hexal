import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { createRegion, REGION_COLORS } from '../../types/Campaign';
import Icon from '../icons/Icon';

interface CreateRegionFromSelectionModalProps {
  hexKeys: string[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateRegionFromSelectionModal({ hexKeys, onClose, onCreated }: CreateRegionFromSelectionModalProps) {
  const { regions, updateCampaignData } = useCampaign();

  // Pick first unused color
  const usedColors = new Set(regions.map(r => r.color));
  const defaultColor = REGION_COLORS.find(c => !usedColors.has(c)) ?? REGION_COLORS[0];

  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultColor);

  const handleCreate = () => {
    const region = createRegion(name || 'New Region', color);
    region.hexKeys = hexKeys;

    // Evict selected hex keys from all existing regions (one-region-per-hex rule)
    const keySet = new Set(hexKeys);
    const updatedRegions = regions.map(r => {
      const filtered = r.hexKeys.filter(k => !keySet.has(k));
      return filtered.length !== r.hexKeys.length ? { ...r, hexKeys: filtered } : r;
    });

    updateCampaignData({ regions: [...updatedRegions, region] });
    onCreated();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Icon name="map" size={18} /> Create Region from {hexKeys.length} Hex{hexKeys.length !== 1 ? 'es' : ''}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Name</label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Region name"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>Color</label>
            <div className="region-color-palette">
              {REGION_COLORS.map(c => (
                <div
                  key={c}
                  className={`region-color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate}>Create Region</button>
        </div>
      </div>
    </div>
  );
}

export default CreateRegionFromSelectionModal;
