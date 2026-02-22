// NewCampaignModal - Create new campaign dialog
import React, { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface NewCampaignModalProps {
  onClose: () => void;
}

function NewCampaignModal({ onClose }: NewCampaignModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const { newCampaign } = useCampaign();
  const [name, setName] = useState('My Campaign');
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);

  const handleCreate = () => {
    if (!name.trim()) return;
    newCampaign(name, width, height);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-campaign-modal-title"
    >
      <div ref={focusTrapRef} className="modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h3 id="new-campaign-modal-title">New Campaign</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label htmlFor="new-campaign-name">Campaign Name</label>
            <input
              id="new-campaign-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label id="new-campaign-width">Width</label>
              <div className="stepper" role="group" aria-labelledby="new-campaign-width">
                <button aria-label="Decrease width" onClick={() => setWidth(Math.max(5, width - 1))}>−</button>
                <span>{width}</span>
                <button aria-label="Increase width" onClick={() => setWidth(Math.min(50, width + 1))}>+</button>
              </div>
            </div>
            <div className="field-group">
              <label id="new-campaign-height">Height</label>
              <div className="stepper" role="group" aria-labelledby="new-campaign-height">
                <button aria-label="Decrease height" onClick={() => setHeight(Math.max(5, height - 1))}>−</button>
                <span>{height}</span>
                <button aria-label="Increase height" onClick={() => setHeight(Math.min(50, height + 1))}>+</button>
              </div>
            </div>
          </div>
          <p className="hint">Grid size: {width} × {height} = {width * height} hexes</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewCampaignModal;
