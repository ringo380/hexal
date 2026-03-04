// ExportTemplateModal - Export current campaign as a reusable template
import { useState, useCallback } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { extractTemplateFromCampaign, wrapTemplateForExport, encodeShareCode } from '../../services/templateService';
import Icon from '../icons/Icon';
import type { IconName } from '../icons/Icon';

interface ExportTemplateModalProps {
  onClose: () => void;
}

const ACCENT_COLORS = [
  '#4a9eff', '#4caf50', '#f44336', '#ff9800', '#9c27b0',
  '#00bcd4', '#e91e63', '#8bc34a', '#ff5722', '#607d8b',
  '#3f51b5', '#cddc39',
];

const ICON_OPTIONS: IconName[] = [
  'hexagon', 'map', 'sword', 'shield', 'tree', 'mountain',
  'snowflake', 'sun', 'moon', 'star', 'skull', 'water',
  'leaf', 'flower', 'wind', 'cloud', 'drop', 'triangle',
];

function ExportTemplateModal({ onClose }: ExportTemplateModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const { campaign } = useCampaign();

  const [name, setName] = useState(campaign?.name ?? 'My Template');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<IconName>('hexagon');
  const [accentColor, setAccentColor] = useState(ACCENT_COLORS[0]);
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const getTemplate = useCallback(() => {
    if (!campaign) return null;
    return extractTemplateFromCampaign(campaign, {
      name: name.trim() || 'Unnamed Template',
      description: description.trim(),
      icon,
      accentColor,
      tags: tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
    });
  }, [campaign, name, description, icon, accentColor, tags]);

  const handleSaveToLibrary = async () => {
    const template = getTemplate();
    if (!template) return;

    const envelope = wrapTemplateForExport(template);
    const fileName = `${template.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim()}.hexal-template`;
    const result = await window.electronAPI.saveUserTemplate(
      JSON.stringify(envelope, null, 2),
      fileName
    );
    if (result.success) {
      setStatus('Saved to template library');
      setTimeout(onClose, 1200);
    } else {
      setStatus(`Error: ${result.error}`);
    }
  };

  const handleExportToFile = async () => {
    const template = getTemplate();
    if (!template) return;

    const defaultName = template.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim();
    const filePath = await window.electronAPI.exportTemplateDialog(defaultName);
    if (!filePath) return;

    const envelope = wrapTemplateForExport(template);
    const result = await window.electronAPI.saveFile(filePath, JSON.stringify(envelope, null, 2));
    if (result.success) {
      setStatus('Exported to file');
      setTimeout(onClose, 1200);
    } else {
      setStatus(`Error: ${result.error}`);
    }
  };

  const handleCopyShareCode = async () => {
    const template = getTemplate();
    if (!template) return;

    try {
      const code = await encodeShareCode(template);
      await navigator.clipboard.writeText(code);
      setStatus('Share code copied to clipboard');
    } catch {
      setStatus('Failed to generate share code');
    }
  };

  if (!campaign) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="export-template-title">
      <div ref={focusTrapRef} className="modal export-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="export-template-title">Save as Template</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label htmlFor="tpl-name">Template Name</label>
            <input
              id="tpl-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-group">
            <label htmlFor="tpl-desc">Description</label>
            <textarea
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of this template..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div className="field-group">
            <label>Icon</label>
            <div className="export-template-icon-picker">
              {ICON_OPTIONS.map(iconName => (
                <button
                  key={iconName}
                  className={`icon-picker-item ${icon === iconName ? 'selected' : ''}`}
                  onClick={() => setIcon(iconName)}
                  aria-label={iconName}
                >
                  <Icon name={iconName} size={16} />
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label>Accent Color</label>
            <div className="color-swatch-picker">
              {ACCENT_COLORS.map(color => (
                <button
                  key={color}
                  className={`color-swatch ${accentColor === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setAccentColor(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="tpl-tags">Tags (comma-separated)</label>
            <input
              id="tpl-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. arctic, horror, wilderness"
            />
          </div>

          <div className="template-summary" style={{ marginTop: 12 }}>
            <div className="template-summary-details">
              <span>{campaign.terrainTypes.length} terrain types</span>
              <span>{campaign.encounterTables.length} encounter tables</span>
              <span>{(campaign.landmarkTables ?? []).length} landmark tables</span>
              <span>{(campaign.factions ?? []).length} factions</span>
              <span>{(campaign.regions ?? []).length} regions</span>
            </div>
          </div>

          {status && (
            <div style={{ marginTop: 8, fontSize: 12, color: status.startsWith('Error') ? '#f44336' : '#4caf50' }}>
              {status}
            </div>
          )}
        </div>
        <div className="modal-footer export-template-actions">
          <button className="btn btn-secondary" onClick={handleSaveToLibrary} disabled={!name.trim()}>
            Save to Library
          </button>
          <button className="btn btn-secondary" onClick={handleExportToFile} disabled={!name.trim()}>
            Export to File
          </button>
          <button className="btn btn-primary" onClick={handleCopyShareCode} disabled={!name.trim()}>
            Copy Share Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportTemplateModal;
