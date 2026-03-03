// NewCampaignModal - Create new campaign dialog with template gallery, customization wizard
import { useState, useEffect } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { CAMPAIGN_TEMPLATES } from '../../data/campaignTemplates';
import type { CampaignTemplate, TemplateListItem, TemplateCustomizations, TemplateRegistryEntry } from '../../types/CampaignTemplate';
import { validateTemplateFile, createDefaultCustomizations, decodeShareCode } from '../../services/templateService';
import { fetchRegistry, fetchCommunityTemplate, clearRegistryCache } from '../../services/templateRegistryService';
import Icon from '../icons/Icon';
import TemplateCustomizeStep from './TemplateCustomizeStep';

interface NewCampaignModalProps {
  onClose: () => void;
}

type Step = 'gallery' | 'configure' | 'customize';

// ============ Main Modal ============

function NewCampaignModal({ onClose }: NewCampaignModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const { newCampaign } = useCampaign();

  const [step, setStep] = useState<Step>('gallery');
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [templateSource, setTemplateSource] = useState<'builtin' | 'user' | 'community'>('builtin');
  const [name, setName] = useState('My Campaign');
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);
  const [customizations, setCustomizations] = useState<TemplateCustomizations>(createDefaultCustomizations());

  const handleSelectTemplate = (template: CampaignTemplate | null, source: 'builtin' | 'user' | 'community' = 'builtin') => {
    setSelectedTemplate(template);
    setTemplateSource(source);
    setCustomizations(createDefaultCustomizations());
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
    if (step === 'customize') {
      setStep('configure');
    } else {
      setStep('gallery');
    }
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    if (selectedTemplate) {
      // Determine whether to pass template object or ID
      const isBuiltin = templateSource === 'builtin' && CAMPAIGN_TEMPLATES.some(t => t.id === selectedTemplate.id);
      const hasCustomizations = customizations.disabledTerrainIds.size > 0
        || Object.keys(customizations.terrainNameOverrides).length > 0
        || customizations.disabledFactionIndices.size > 0
        || Object.keys(customizations.factionNameOverrides).length > 0
        || customizations.disabledRegionIndices.size > 0
        || customizations.disabledEncounterTableIds.size > 0
        || customizations.disabledLandmarkTableIds.size > 0
        || Object.keys(customizations.generationConfig).length > 0
        || customizations.calendarPreset !== null;

      if (isBuiltin && !hasCustomizations) {
        newCampaign(name, width, height, selectedTemplate.id);
      } else {
        newCampaign(name, width, height, selectedTemplate, hasCustomizations ? customizations : undefined);
      }
    } else {
      newCampaign(name, width, height);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'configure') {
      handleCreate();
    }
  };

  const stepLabels = ['Template', 'Configure', 'Customize'];
  const stepIndex = step === 'gallery' ? 0 : step === 'configure' ? 1 : 2;

  const modalClassName = [
    'modal',
    'new-campaign-modal',
    step === 'gallery' ? 'new-campaign-modal-gallery' : '',
    step === 'customize' ? 'new-campaign-modal-customize' : '',
  ].filter(Boolean).join(' ');

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
        className={modalClassName}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <h3 id="new-campaign-modal-title">
            {step === 'gallery' ? 'Choose a Template' : step === 'configure' ? 'Configure Campaign' : 'Customize Template'}
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Wizard step indicator */}
        <div className="wizard-steps">
          {stepLabels.map((label, i) => (
            <span key={label}>
              {i > 0 && <span className="wizard-step-connector" />}
              <span className={`wizard-step ${i === stepIndex ? 'active' : i < stepIndex ? 'completed' : ''}`}>
                <span className="wizard-step-number">{i + 1}</span>
                {label}
              </span>
            </span>
          ))}
        </div>

        <div className="modal-body">
          {step === 'gallery' && (
            <TemplateGallery onSelect={handleSelectTemplate} />
          )}
          {step === 'configure' && (
            <ConfigureStep
              template={selectedTemplate}
              name={name}
              width={width}
              height={height}
              onNameChange={setName}
              onWidthChange={setWidth}
              onHeightChange={setHeight}
              onCustomize={selectedTemplate ? () => setStep('customize') : undefined}
            />
          )}
          {step === 'customize' && selectedTemplate && (
            <TemplateCustomizeStep
              template={selectedTemplate}
              customizations={customizations}
              onChange={setCustomizations}
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
  onSelect: (template: CampaignTemplate | null, source?: 'builtin' | 'user' | 'community') => void;
}

type GalleryTab = 'builtin' | 'user' | 'community';

function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const [activeTab, setActiveTab] = useState<GalleryTab>('builtin');
  const [userTemplates, setUserTemplates] = useState<TemplateListItem[]>([]);
  const [showShareCodeInput, setShowShareCodeInput] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [shareCodeError, setShareCodeError] = useState<string | null>(null);

  // Load user templates on mount
  useEffect(() => {
    loadUserTemplates();
  }, []);

  const loadUserTemplates = async () => {
    try {
      const files = await window.electronAPI.listUserTemplates();
      const templates: TemplateListItem[] = [];
      for (const file of files) {
        if (!file.content) continue;
        try {
          const data = JSON.parse(file.content);
          const validation = validateTemplateFile(data);
          if (validation.valid && validation.template) {
            templates.push({
              template: validation.template,
              source: 'user',
              filePath: file.filePath,
            });
          }
        } catch {
          // Skip invalid files
        }
      }
      setUserTemplates(templates);
    } catch {
      // Silently fail
    }
  };

  const handleImportFile = async () => {
    const content = await window.electronAPI.importTemplateDialog();
    if (!content) return;

    try {
      const data = JSON.parse(content);
      const validation = validateTemplateFile(data);
      if (validation.valid && validation.template) {
        // Save to user library
        const fileName = `${validation.template.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim()}.hexal-template`;
        await window.electronAPI.saveUserTemplate(content, fileName);
        await loadUserTemplates();
        setActiveTab('user');
      } else {
        console.error('Invalid template file:', validation.errors);
      }
    } catch {
      console.error('Failed to parse template file');
    }
  };

  const handleImportShareCode = async () => {
    setShareCodeError(null);
    try {
      const template = await decodeShareCode(shareCode.trim());
      // Save to user library and select it
      const { wrapTemplateForExport } = await import('../../services/templateService');
      const envelope = wrapTemplateForExport(template);
      const fileName = `${template.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim()}.hexal-template`;
      await window.electronAPI.saveUserTemplate(JSON.stringify(envelope, null, 2), fileName);
      await loadUserTemplates();
      setShowShareCodeInput(false);
      setShareCode('');
      setActiveTab('user');
    } catch (err: any) {
      setShareCodeError(err.message || 'Invalid share code');
    }
  };

  const handleDeleteUserTemplate = async (item: TemplateListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.filePath) return;
    await window.electronAPI.deleteUserTemplate(item.filePath);
    await loadUserTemplates();
  };

  return (
    <div>
      {/* Gallery tabs */}
      <div className="gallery-tabs">
        <button
          className={`gallery-tab ${activeTab === 'builtin' ? 'active' : ''}`}
          onClick={() => setActiveTab('builtin')}
        >
          Built-in
        </button>
        <button
          className={`gallery-tab ${activeTab === 'user' ? 'active' : ''}`}
          onClick={() => setActiveTab('user')}
        >
          My Templates {userTemplates.length > 0 && `(${userTemplates.length})`}
        </button>
        <button
          className={`gallery-tab ${activeTab === 'community' ? 'active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          Community
        </button>
      </div>

      {activeTab === 'builtin' && (
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

          {CAMPAIGN_TEMPLATES.map(template => (
            <button
              key={template.id}
              className="template-card"
              style={{ borderLeftColor: template.accentColor }}
              onClick={() => onSelect(template, 'builtin')}
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
      )}

      {activeTab === 'user' && (
        <div>
          <div className="template-gallery-section-header">
            <h4>My Templates</h4>
            <div className="template-gallery-header-actions">
              <button onClick={handleImportFile}>Import File</button>
              <button onClick={() => setShowShareCodeInput(!showShareCodeInput)}>Import Share Code</button>
            </div>
          </div>

          {showShareCodeInput && (
            <div className="share-code-container" style={{ marginBottom: 12 }}>
              <textarea
                className="share-code-textarea"
                placeholder="Paste share code here (starts with hexal-tpl:v1:)..."
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value)}
                rows={3}
              />
              {shareCodeError && (
                <div style={{ fontSize: 11, color: '#f44336', marginTop: 4 }}>{shareCodeError}</div>
              )}
              <div className="share-code-actions">
                <button className="btn btn-primary" onClick={handleImportShareCode} disabled={!shareCode.trim()}>
                  Import
                </button>
                <button className="btn btn-secondary" onClick={() => { setShowShareCodeInput(false); setShareCode(''); setShareCodeError(null); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {userTemplates.length === 0 ? (
            <div className="empty-hint">No custom templates yet. Import a file or share code to get started.</div>
          ) : (
            <div className="template-gallery">
              {userTemplates.map(item => (
                <button
                  key={item.filePath}
                  className="template-card template-card-user"
                  style={{ borderLeftColor: item.template.accentColor }}
                  onClick={() => onSelect(item.template, 'user')}
                  aria-label={item.template.name}
                >
                  <div className="template-card-icon" style={{ color: item.template.accentColor }}>
                    <Icon name={item.template.icon} size={24} />
                  </div>
                  <div className="template-card-content">
                    <div className="template-card-name">{item.template.name}</div>
                    <div className="template-card-desc">{item.template.description}</div>
                    <div className="template-card-tags">
                      {item.template.tags.map(tag => (
                        <span key={tag} className="template-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="template-card-delete"
                    onClick={(e) => handleDeleteUserTemplate(item, e)}
                    aria-label={`Delete ${item.template.name}`}
                  >
                    ×
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'community' && (
        <CommunityTab onSelect={(template) => onSelect(template, 'community')} />
      )}
    </div>
  );
}

// ============ Community Tab ============

function CommunityTab({ onSelect }: { onSelect: (template: CampaignTemplate) => void }) {
  const [entries, setEntries] = useState<TemplateRegistryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [installing, setInstalling] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Lazy load on tab activation
  useEffect(() => {
    if (!loaded) {
      loadRegistry();
    }
  }, [loaded]);

  const loadRegistry = async () => {
    setLoading(true);
    setError(null);
    try {
      const registry = await fetchRegistry();
      setEntries(registry.templates);
      setLoaded(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load community templates');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    clearRegistryCache();
    loadRegistry();
  };

  const handleInstall = async (entry: TemplateRegistryEntry) => {
    setInstalling(entry.id);
    try {
      const template = await fetchCommunityTemplate(entry);
      // Save to user library
      const { wrapTemplateForExport } = await import('../../services/templateService');
      const envelope = wrapTemplateForExport(template, entry.author);
      const fileName = `${template.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim()}.hexal-template`;
      await window.electronAPI.saveUserTemplate(JSON.stringify(envelope, null, 2), fileName);
      // Select it directly
      onSelect(template);
    } catch (err: any) {
      console.error('Failed to install community template:', err);
    } finally {
      setInstalling(null);
    }
  };

  const filtered = entries.filter(entry => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return <div className="community-loading"><Icon name="spinner" size={16} /> Loading community templates...</div>;
  }

  if (error) {
    return (
      <div className="community-error">
        <p>{error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  if (entries.length === 0) {
    return <div className="empty-hint">No community templates available yet.</div>;
  }

  return (
    <div>
      <div className="community-search">
        <input
          type="text"
          placeholder="Search by name or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="template-gallery">
        {filtered.map(entry => (
          <div
            key={entry.id}
            className="template-card"
            style={{ borderLeftColor: '#607d8b', flexDirection: 'column' }}
          >
            <div className="template-card-name">{entry.name}</div>
            <div className="template-card-desc">{entry.description}</div>
            <div className="template-card-meta">
              <span>by {entry.author}</span>
              <span>{entry.terrainCount} terrains</span>
              <span>{entry.factionCount} factions</span>
            </div>
            <div className="template-card-tags">
              {entry.tags.map(tag => (
                <span key={tag} className="template-tag">{tag}</span>
              ))}
            </div>
            <button
              className="community-install-btn"
              onClick={() => handleInstall(entry)}
              disabled={installing === entry.id}
            >
              {installing === entry.id ? 'Installing...' : 'Install'}
            </button>
          </div>
        ))}
      </div>
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
  onCustomize?: () => void;
}

function ConfigureStep({ template, name, width, height, onNameChange, onWidthChange, onHeightChange, onCustomize }: ConfigureStepProps) {
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

      {onCustomize && (
        <button className="btn btn-secondary" onClick={onCustomize} style={{ marginTop: 8 }}>
          Customize Template...
        </button>
      )}
    </>
  );
}

export default NewCampaignModal;
