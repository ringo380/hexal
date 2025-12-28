// ExportModal - Export campaign dialog
import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { exportJSON, exportMarkdown } from '../../services/export';

type ExportFormat = 'json' | 'markdown';

interface ExportModalProps {
  onClose: () => void;
}

function ExportModal({ onClose }: ExportModalProps) {
  const { campaign } = useCampaign();
  const [format, setFormat] = useState<ExportFormat>('json');
  const [includeUndiscovered, setIncludeUndiscovered] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    if (!campaign) return;

    try {
      setError(null);

      // Get save path
      const defaultName = format === 'json'
        ? `${campaign.name}.json`
        : `${campaign.name}.md`;

      const filePath = await window.electronAPI.saveFileDialog(defaultName);
      if (!filePath) return; // User cancelled

      // Generate content
      let content: string;
      if (format === 'json') {
        content = exportJSON(campaign);
      } else {
        content = exportMarkdown(campaign, includeUndiscovered);
      }

      // Save file
      const result = await window.electronAPI.saveFile(filePath, content);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 1000);
      } else {
        throw new Error(result.error || 'Failed to save file');
      }
    } catch (err) {
      setError(`Export failed: ${err}`);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Export Campaign</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
              <option value="json">JSON (Full Campaign Data)</option>
              <option value="markdown">Markdown (DM Reference)</option>
            </select>
          </div>

          {format === 'markdown' && (
            <div className="field-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeUndiscovered}
                  onChange={(e) => setIncludeUndiscovered(e.target.checked)}
                />
                Include Undiscovered Hexes
              </label>
            </div>
          )}

          {format === 'json' && (
            <p className="hint">
              JSON export includes all campaign data and can be re-imported.
            </p>
          )}

          {format === 'markdown' && (
            <p className="hint">
              Markdown export is formatted for easy reading during play.
            </p>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          {success && (
            <div className="success-message">Export successful!</div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleExport} disabled={success}>
            Export...
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
