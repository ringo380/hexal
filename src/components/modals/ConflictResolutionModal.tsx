// ConflictResolutionModal — Presents sync conflicts and lets the user choose
// a resolution strategy: keep local changes, accept remote changes, or merge.

import { useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { CampaignConflict, ConflictResolution } from '../../types/Sync';
import type { FieldDiff, HexConflict } from '../../types/Sync';

interface ConflictResolutionModalProps {
  conflict: CampaignConflict;
  onResolve: (resolution: ConflictResolution) => Promise<void>;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return '(empty)';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  return 'Modified';
}

function MetadataDiffTable({ diffs }: { diffs: FieldDiff[] }) {
  if (diffs.length === 0) return null;

  return (
    <div className="conflict-section">
      <h4 className="conflict-section-title">Campaign Changes</h4>
      <table className="conflict-diff-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Your Version</th>
            <th>Their Version</th>
          </tr>
        </thead>
        <tbody>
          {diffs.map(diff => (
            <tr key={diff.field}>
              <td className="conflict-field-label">{diff.label}</td>
              <td className="conflict-value conflict-value--local">
                {formatValue(diff.localValue)}
              </td>
              <td className="conflict-value conflict-value--remote">
                {formatValue(diff.remoteValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HexConflictList({ hexConflicts }: { hexConflicts: HexConflict[] }) {
  const [expanded, setExpanded] = useState(false);

  if (hexConflicts.length === 0) return null;

  return (
    <div className="conflict-section">
      <button
        className="conflict-section-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${hexConflicts.length} hex conflicts, click to ${expanded ? 'collapse' : 'expand'}`}
      >
        <span className="conflict-toggle-icon">{expanded ? '\u25BC' : '\u25B6'}</span>
        <h4 className="conflict-section-title">
          Hex Conflicts ({hexConflicts.length})
        </h4>
      </button>
      {expanded && (
        <ul className="conflict-hex-list">
          {hexConflicts.map(hc => (
            <li key={hc.hexKey} className="conflict-hex-item">
              <span className="conflict-hex-key">Hex {hc.hexKey}</span>
              <span className="conflict-hex-detail">
                Both versions modified terrain, content, or status
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AutoMergedSummary({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="conflict-section conflict-auto-merged">
      <span className="conflict-auto-merged-icon">{'\u2713'}</span>
      {count} hex{count === 1 ? '' : 'es'} with non-overlapping changes merged automatically
    </div>
  );
}

function ConflictResolutionModal({ conflict, onResolve }: ConflictResolutionModalProps) {
  const [resolving, setResolving] = useState(false);
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: undefined });

  const handleResolve = async (resolution: ConflictResolution) => {
    setResolving(true);
    try {
      await onResolve(resolution);
    } finally {
      setResolving(false);
    }
  };

  const hasMetadataDiffs = conflict.metadataDiffs.length > 0;
  const hasHexConflicts = conflict.hexConflicts.length > 0;
  const hasAutoMerged = conflict.autoMergedHexKeys.length > 0;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div ref={focusTrapRef} className="modal conflict-resolution-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="conflict-modal-title">Sync Conflict Detected</h3>
        </div>
        <div className="modal-body">
          <p className="conflict-description">
            Another device updated this campaign while you were editing.
            Choose how to resolve the conflict.
          </p>

          <div className="conflict-version-info">
            <span>Your version: {conflict.localVersion}</span>
            <span>Server version: {conflict.remoteVersion}</span>
          </div>

          {hasMetadataDiffs && (
            <MetadataDiffTable diffs={conflict.metadataDiffs} />
          )}

          {hasHexConflicts && (
            <HexConflictList hexConflicts={conflict.hexConflicts} />
          )}

          {hasAutoMerged && (
            <AutoMergedSummary count={conflict.autoMergedHexKeys.length} />
          )}

          {!hasMetadataDiffs && !hasHexConflicts && !hasAutoMerged && (
            <p className="empty-hint">
              Version mismatch detected but no field-level differences found.
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={() => handleResolve({ strategy: 'keep-local' })}
            disabled={resolving}
            aria-label="Keep your local changes"
          >
            {resolving ? 'Resolving...' : 'Keep Mine'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleResolve({ strategy: 'keep-remote' })}
            disabled={resolving}
            aria-label="Accept remote changes"
          >
            Keep Theirs
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConflictResolutionModal;
