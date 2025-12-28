// NewCampaignModal - Create new campaign dialog
import React, { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';

interface NewCampaignModalProps {
  onClose: () => void;
}

function NewCampaignModal({ onClose }: NewCampaignModalProps) {
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
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h3>New Campaign</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label>Campaign Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>Width</label>
              <div className="stepper">
                <button onClick={() => setWidth(Math.max(5, width - 1))}>−</button>
                <span>{width}</span>
                <button onClick={() => setWidth(Math.min(50, width + 1))}>+</button>
              </div>
            </div>
            <div className="field-group">
              <label>Height</label>
              <div className="stepper">
                <button onClick={() => setHeight(Math.max(5, height - 1))}>−</button>
                <span>{height}</span>
                <button onClick={() => setHeight(Math.min(50, height + 1))}>+</button>
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
