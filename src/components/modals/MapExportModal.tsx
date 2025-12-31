// MapExportModal - Comprehensive map export dialog with presets and options

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_PRESETS,
  type MapExportOptions,
  type ExportFormat,
  type PaperSize
} from '../../types/MapExport';
import {
  exportAndSave,
  generatePreview,
  estimateFileSize
} from '../../services/mapExport';

interface MapExportModalProps {
  onClose: () => void;
}

function MapExportModal({ onClose }: MapExportModalProps) {
  const { campaign } = useCampaign();

  // Export options state
  const [options, setOptions] = useState<MapExportOptions>({ ...DEFAULT_EXPORT_OPTIONS });
  const [activePreset, setActivePreset] = useState<string | null>('quick');

  // Section collapse state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['format', 'view', 'appearance'])
  );

  // Preview state
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // File size estimate
  const [sizeEstimate, setSizeEstimate] = useState<{ min: string; max: string } | null>(null);

  // Update options helper
  const updateOption = <K extends keyof MapExportOptions>(key: K, value: MapExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
    setActivePreset(null); // Clear preset when manually changing options
  };

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const preset = EXPORT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setOptions({ ...DEFAULT_EXPORT_OPTIONS, ...preset.options });
      setActivePreset(presetId);
    }
  };

  // Generate preview (debounced)
  useEffect(() => {
    if (!campaign) return;

    const timeoutId = setTimeout(() => {
      const canvas = generatePreview(campaign, options, 350, 250);
      setPreviewCanvas(canvas);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [campaign, options]);

  // Update file size estimate
  useEffect(() => {
    if (!campaign) return;
    const estimate = estimateFileSize(campaign, options);
    setSizeEstimate(estimate);
  }, [campaign, options.format, options.scale, options.quality]);

  // Render preview canvas
  useEffect(() => {
    if (previewCanvas && previewRef.current) {
      previewRef.current.innerHTML = '';
      previewRef.current.appendChild(previewCanvas);
    }
  }, [previewCanvas]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!campaign) return;

    setIsExporting(true);
    setError(null);

    try {
      const result = await exportAndSave(campaign, options);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
      } else {
        if (result.error !== 'Export cancelled') {
          throw new Error(result.error || 'Export failed');
        }
        setIsExporting(false);
      }
    } catch (err) {
      setError(`Export failed: ${err}`);
      setIsExporting(false);
    }
  }, [campaign, options, onClose]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleExport]);

  if (!campaign) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg map-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Export Map</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Presets */}
          <div className="export-presets">
            {EXPORT_PRESETS.map(preset => (
              <button
                key={preset.id}
                className={`preset-btn ${activePreset === preset.id ? 'active' : ''}`}
                onClick={() => handlePresetSelect(preset.id)}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Format & Resolution Section */}
          <div className={`export-section ${expandedSections.has('format') ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('format')}>
              <span className="section-icon">{expandedSections.has('format') ? '▼' : '▶'}</span>
              <span className="section-title">Format & Resolution</span>
            </div>
            {expandedSections.has('format') && (
              <div className="section-content">
                <div className="option-row">
                  <label>Format</label>
                  <div className="button-group">
                    {(['png', 'jpeg', 'pdf'] as ExportFormat[]).map(format => (
                      <button
                        key={format}
                        className={`option-btn ${options.format === format ? 'active' : ''}`}
                        onClick={() => updateOption('format', format)}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="option-row">
                  <label>Scale</label>
                  <div className="button-group">
                    {[1, 2, 3, 4].map(scale => (
                      <button
                        key={scale}
                        className={`option-btn ${options.scale === scale ? 'active' : ''}`}
                        onClick={() => updateOption('scale', scale)}
                      >
                        {scale}x
                      </button>
                    ))}
                  </div>
                  {sizeEstimate && (
                    <span className="size-estimate">~{sizeEstimate.min} - {sizeEstimate.max}</span>
                  )}
                </div>

                {options.format === 'jpeg' && (
                  <div className="option-row">
                    <label>Quality</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={options.quality}
                      onChange={(e) => updateOption('quality', parseFloat(e.target.value))}
                      className="quality-slider"
                    />
                    <span className="quality-value">{Math.round(options.quality * 100)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* View Mode Section */}
          <div className={`export-section ${expandedSections.has('view') ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('view')}>
              <span className="section-icon">{expandedSections.has('view') ? '▼' : '▶'}</span>
              <span className="section-title">View Mode</span>
            </div>
            {expandedSections.has('view') && (
              <div className="section-content">
                <div className="option-row">
                  <label>View</label>
                  <div className="button-group">
                    <button
                      className={`option-btn ${options.viewMode === 'dm' ? 'active' : ''}`}
                      onClick={() => updateOption('viewMode', 'dm')}
                    >
                      DM View
                    </button>
                    <button
                      className={`option-btn ${options.viewMode === 'player' ? 'active' : ''}`}
                      onClick={() => updateOption('viewMode', 'player')}
                    >
                      Player View
                    </button>
                  </div>
                </div>

                {options.viewMode === 'player' && (
                  <div className="option-row">
                    <label>Undiscovered Hexes</label>
                    <div className="button-group">
                      <button
                        className={`option-btn ${options.playerFogStyle === 'fog' ? 'active' : ''}`}
                        onClick={() => updateOption('playerFogStyle', 'fog')}
                      >
                        Show as Fog
                      </button>
                      <button
                        className={`option-btn ${options.playerFogStyle === 'blank' ? 'active' : ''}`}
                        onClick={() => updateOption('playerFogStyle', 'blank')}
                      >
                        Hide Completely
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Appearance Section */}
          <div className={`export-section ${expandedSections.has('appearance') ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('appearance')}>
              <span className="section-icon">{expandedSections.has('appearance') ? '▼' : '▶'}</span>
              <span className="section-title">Appearance</span>
            </div>
            {expandedSections.has('appearance') && (
              <div className="section-content">
                <div className="option-row">
                  <label>Color Mode</label>
                  <div className="button-group">
                    <button
                      className={`option-btn ${options.colorMode === 'dark' ? 'active' : ''}`}
                      onClick={() => updateOption('colorMode', 'dark')}
                    >
                      Dark
                    </button>
                    <button
                      className={`option-btn ${options.colorMode === 'light' ? 'active' : ''}`}
                      onClick={() => updateOption('colorMode', 'light')}
                    >
                      Light
                    </button>
                    <button
                      className={`option-btn ${options.colorMode === 'print-bw' ? 'active' : ''}`}
                      onClick={() => updateOption('colorMode', 'print-bw')}
                    >
                      B&W
                    </button>
                  </div>
                </div>

                <div className="option-row checkbox-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.showHexBorders}
                      onChange={(e) => updateOption('showHexBorders', e.target.checked)}
                    />
                    Hex Borders
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.showCoordinates}
                      onChange={(e) => updateOption('showCoordinates', e.target.checked)}
                    />
                    Coordinates
                  </label>
                </div>

                <div className="option-row checkbox-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.showTerrainLabels}
                      onChange={(e) => updateOption('showTerrainLabels', e.target.checked)}
                    />
                    Terrain Labels
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.showStatusDots}
                      onChange={(e) => updateOption('showStatusDots', e.target.checked)}
                    />
                    Status Dots
                  </label>
                </div>

                <div className="option-row checkbox-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.showContentIndicators}
                      onChange={(e) => updateOption('showContentIndicators', e.target.checked)}
                      disabled={options.viewMode === 'player'}
                    />
                    Content Indicators
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Legend & Metadata Section */}
          <div className={`export-section ${expandedSections.has('metadata') ? 'expanded' : ''}`}>
            <div className="section-header" onClick={() => toggleSection('metadata')}>
              <span className="section-icon">{expandedSections.has('metadata') ? '▼' : '▶'}</span>
              <span className="section-title">Legend & Metadata</span>
            </div>
            {expandedSections.has('metadata') && (
              <div className="section-content">
                <div className="option-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.showTitle}
                      onChange={(e) => updateOption('showTitle', e.target.checked)}
                    />
                    Show Title
                  </label>
                  {options.showTitle && (
                    <input
                      type="text"
                      className="title-input"
                      placeholder={campaign.name}
                      value={options.customTitle || ''}
                      onChange={(e) => updateOption('customTitle', e.target.value || undefined)}
                    />
                  )}
                </div>

                <div className="option-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.showLegend}
                      onChange={(e) => updateOption('showLegend', e.target.checked)}
                    />
                    Show Legend
                  </label>
                </div>

                <div className="option-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={options.showScale}
                      onChange={(e) => updateOption('showScale', e.target.checked)}
                    />
                    Show Scale
                  </label>
                  {options.showScale && (
                    <input
                      type="text"
                      className="scale-input"
                      placeholder="1 hex = 6 miles"
                      value={options.scaleText || ''}
                      onChange={(e) => updateOption('scaleText', e.target.value || undefined)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* PDF Settings Section (only for PDF format) */}
          {options.format === 'pdf' && (
            <div className={`export-section ${expandedSections.has('pdf') ? 'expanded' : ''}`}>
              <div className="section-header" onClick={() => toggleSection('pdf')}>
                <span className="section-icon">{expandedSections.has('pdf') ? '▼' : '▶'}</span>
                <span className="section-title">PDF Settings</span>
              </div>
              {expandedSections.has('pdf') && (
                <div className="section-content">
                  <div className="option-row">
                    <label>Paper Size</label>
                    <select
                      value={options.paperSize}
                      onChange={(e) => updateOption('paperSize', e.target.value as PaperSize)}
                      className="paper-select"
                    >
                      <option value="letter">Letter (8.5 × 11 in)</option>
                      <option value="a4">A4 (210 × 297 mm)</option>
                      <option value="a3">A3 (297 × 420 mm)</option>
                      <option value="tabloid">Tabloid (11 × 17 in)</option>
                    </select>
                  </div>

                  <div className="option-row">
                    <label>Orientation</label>
                    <div className="button-group">
                      <button
                        className={`option-btn ${options.orientation === 'landscape' ? 'active' : ''}`}
                        onClick={() => updateOption('orientation', 'landscape')}
                      >
                        Landscape
                      </button>
                      <button
                        className={`option-btn ${options.orientation === 'portrait' ? 'active' : ''}`}
                        onClick={() => updateOption('orientation', 'portrait')}
                      >
                        Portrait
                      </button>
                    </div>
                  </div>

                  <div className="option-row">
                    <label>Margins</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={options.margins}
                      onChange={(e) => updateOption('margins', parseInt(e.target.value) || 10)}
                      className="margins-input"
                    />
                    <span className="unit">mm</span>
                  </div>

                  <div className="option-row">
                    <label>Page Mode</label>
                    <div className="button-group">
                      <button
                        className={`option-btn ${options.pageMode === 'fit-to-page' ? 'active' : ''}`}
                        onClick={() => updateOption('pageMode', 'fit-to-page')}
                      >
                        Fit to Page
                      </button>
                      <button
                        className={`option-btn ${options.pageMode === 'multi-page' ? 'active' : ''}`}
                        onClick={() => updateOption('pageMode', 'multi-page')}
                      >
                        Multi-Page
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="export-preview">
            <div className="preview-label">Preview</div>
            <div className="preview-container" ref={previewRef}>
              {!previewCanvas && <div className="preview-loading">Generating preview...</div>}
            </div>
          </div>

          {/* Status messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Export successful!</div>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isExporting || success}
          >
            {isExporting ? 'Exporting...' : 'Export...'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MapExportModal;
