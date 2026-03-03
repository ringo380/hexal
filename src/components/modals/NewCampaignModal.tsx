// NewCampaignModal - Create new campaign dialog with template gallery
import React, { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { CAMPAIGN_TEMPLATES } from '../../data/campaignTemplates';
import type { CampaignTemplate } from '../../types/CampaignTemplate';
import Icon from '../icons/Icon';

interface NewCampaignModalProps {
  onClose: () => void;
}

type Step = 'gallery' | 'configure';

function NewCampaignModal({ onClose }: NewCampaignModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const { newCampaign } = useCampaign();

  const [step, setStep] = useState<Step>('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [name, setName] = useState('My Campaign');
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);

  const handleSelectTemplate = (template: CampaignTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setName(template.name);
      setWidth(template.recommendedWidth);
      setHeight(template.recommendedHeight);
    } else {
      setName('My Campaign');
      setWidth(20);
      setHeight(20);
    }
    setStep('configure');
  };

  const handleBack = () => {
    setStep('gallery');
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    newCampaign(name, width, height, selectedTemplate?.id);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'configure') {
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
      <div
        ref={focusTrapRef}
        className={`modal new-campaign-modal ${step === 'gallery' ? 'new-campaign-modal-gallery' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h3 id="new-campaign-modal-title">
            {step === 'gallery' ? 'Choose a Template' : 'Configure Campaign'}
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {step === 'gallery' ? (
            <TemplateGallery onSelect={handleSelectTemplate} />
          ) : (
            <ConfigureStep
              template={selectedTemplate}
              name={name}
              width={width}
              height={height}
              onNameChange={setName}
              onWidthChange={setWidth}
              onHeightChange={setHeight}
              onBack={handleBack}
            />
          )}
        </div>
        <div className="modal-footer">
          {step === 'gallery' ? (
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={handleBack}>Back</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>
                Create
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ Gallery Step ============

interface TemplateGalleryProps {
  onSelect: (template: CampaignTemplate | null) => void;
}

function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  return (
    <div className="template-gallery">
      {/* Blank campaign card */}
      <button
        className="template-card template-card-blank"
        onClick={() => onSelect(null)}
        aria-label="Blank Campaign"
      >
        <div className="template-card-icon">
          <Icon name="hexagon" size={24} />
        </div>
        <div className="template-card-content">
          <div className="template-card-name">Blank Campaign</div>
          <div className="template-card-desc">Start from scratch with default terrain and settings</div>
        </div>
      </button>

      {/* Template cards */}
      {CAMPAIGN_TEMPLATES.map(template => (
        <button
          key={template.id}
          className="template-card"
          style={{ borderLeftColor: template.accentColor }}
          onClick={() => onSelect(template)}
          aria-label={template.name}
        >
          <div className="template-card-icon" style={{ color: template.accentColor }}>
            <Icon name={template.icon} size={24} />
          </div>
          <div className="template-card-content">
            <div className="template-card-name">{template.name}</div>
            <div className="template-card-desc">{template.description}</div>
            <div className="template-card-tags">
              {template.tags.map(tag => (
                <span key={tag} className="template-tag">{tag}</span>
              ))}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ============ Configure Step ============

interface ConfigureStepProps {
  template: CampaignTemplate | null;
  name: string;
  width: number;
  height: number;
  onNameChange: (name: string) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onBack: () => void;
}

function ConfigureStep({ template, name, width, height, onNameChange, onWidthChange, onHeightChange }: ConfigureStepProps) {
  return (
    <>
      {template && (
        <div className="template-summary">
          <div className="template-summary-header">
            <Icon name={template.icon} size={18} />
            <span>{template.name}</span>
          </div>
          <div className="template-summary-details">
            <span>{template.terrainTypes.length} terrain types</span>
            <span>{template.factions.length} factions</span>
            <span>{template.regions.length} regions</span>
            <span>{template.calendarPreset} calendar</span>
          </div>
        </div>
      )}

      <div className="field-group">
        <label htmlFor="new-campaign-name">Campaign Name</label>
        <input
          id="new-campaign-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus
        />
      </div>
      <div className="field-row">
        <div className="field-group">
          <label id="new-campaign-width">Width</label>
          <div className="stepper" role="group" aria-labelledby="new-campaign-width">
            <button aria-label="Decrease width" onClick={() => onWidthChange(Math.max(5, width - 1))}>−</button>
            <span>{width}</span>
            <button aria-label="Increase width" onClick={() => onWidthChange(Math.min(50, width + 1))}>+</button>
          </div>
        </div>
        <div className="field-group">
          <label id="new-campaign-height">Height</label>
          <div className="stepper" role="group" aria-labelledby="new-campaign-height">
            <button aria-label="Decrease height" onClick={() => onHeightChange(Math.max(5, height - 1))}>−</button>
            <span>{height}</span>
            <button aria-label="Increase height" onClick={() => onHeightChange(Math.min(50, height + 1))}>+</button>
          </div>
        </div>
      </div>
      <p className="hint">Grid size: {width} × {height} = {width * height} hexes</p>
    </>
  );
}

export default NewCampaignModal;
