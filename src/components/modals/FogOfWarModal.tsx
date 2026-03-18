// FogOfWarModal — Configure fog of war settings for the player view

import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { createDefaultFogOfWarConfig } from '../../types/Campaign';
import type { FogOfWarConfig } from '../../types/Campaign';

interface FogOfWarModalProps {
  onClose: () => void;
}

function FogOfWarModal({ onClose }: FogOfWarModalProps) {
  const { campaign, updateCampaignData } = useCampaign();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  const current = campaign?.fogOfWarConfig ?? createDefaultFogOfWarConfig();
  const [config, setConfig] = useState<FogOfWarConfig>({ ...current });

  const handleSave = () => {
    updateCampaignData({ fogOfWarConfig: config });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal fog-of-war-modal"
        ref={focusTrapRef}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Fog of War Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="modal-body">
          <div className="fog-of-war-modal-field">
            <label htmlFor="fow-reveal-radius">Reveal Radius</label>
            <div className="fog-of-war-modal-range-row">
              <input
                id="fow-reveal-radius"
                type="range"
                min={1}
                max={3}
                step={1}
                value={config.revealRadius}
                onChange={e => setConfig(prev => ({ ...prev, revealRadius: parseInt(e.target.value, 10) }))}
              />
              <span className="fog-of-war-modal-range-value">{config.revealRadius}</span>
            </div>
            <p className="fog-of-war-modal-hint">
              How many hexes beyond discovered areas show terrain silhouettes (1-3)
            </p>
          </div>

          <div className="fog-of-war-modal-field">
            <label className="fog-of-war-modal-toggle">
              <input
                type="checkbox"
                checked={config.showAdjacentSilhouettes}
                onChange={e => setConfig(prev => ({ ...prev, showAdjacentSilhouettes: e.target.checked }))}
              />
              <span>Show adjacent terrain silhouettes</span>
            </label>
            <p className="fog-of-war-modal-hint">
              When enabled, undiscovered hexes near discovered areas show faint terrain colors
            </p>
          </div>

          <div className="fog-of-war-modal-field">
            <label className="fog-of-war-modal-toggle">
              <input
                type="checkbox"
                checked={config.fadeTransitionEnabled}
                onChange={e => setConfig(prev => ({ ...prev, fadeTransitionEnabled: e.target.checked }))}
              />
              <span>Fade transitions</span>
            </label>
            <p className="fog-of-war-modal-hint">
              Smoothly animate fog changes when hexes are discovered
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} autoFocus>Save</button>
        </div>
      </div>
    </div>
  );
}

export default FogOfWarModal;
