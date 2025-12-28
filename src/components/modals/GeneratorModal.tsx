// GeneratorModal - Content generation dialog
import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useSelection } from '../../stores/SelectionContext';
import { populateHex } from '../../services/generator';
import type { Hex } from '../../types';
import { createHex } from '../../types';

type GeneratorTarget = 'selected' | 'allEmpty';

interface GeneratorModalProps {
  onClose: () => void;
}

function GeneratorModal({ onClose }: GeneratorModalProps) {
  const { campaign, getHex, updateHex } = useCampaign();
  const { selectedCoordinate } = useSelection();

  const [target, setTarget] = useState<GeneratorTarget>('selected');
  const [generateTerrainEnabled, setGenerateTerrainEnabled] = useState(true);
  const [generateEncounterEnabled, setGenerateEncounterEnabled] = useState(true);
  const [preview, setPreview] = useState<string[]>([]);

  const handlePreview = () => {
    if (!campaign) return;

    const results: string[] = [];

    if (target === 'selected' && selectedCoordinate) {
      const existing = getHex(selectedCoordinate);
      let hex: Hex = existing ?? createHex(selectedCoordinate);

      const populated = populateHex(
        hex,
        campaign.terrainTypes,
        campaign.encounterTables,
        { generateTerrain: generateTerrainEnabled, generateEncounter: generateEncounterEnabled }
      );

      results.push(`(${selectedCoordinate.q}, ${selectedCoordinate.r}): ${populated.terrain}`);
      if (populated.encounters.length > (existing?.encounters.length ?? 0)) {
        const newEnc = populated.encounters[populated.encounters.length - 1];
        results.push(`  + ${newEnc.title}`);
      }
    } else if (target === 'allEmpty') {
      let count = 0;
      for (let q = 0; q < campaign.gridWidth && count < 10; q++) {
        for (let r = 0; r < campaign.gridHeight && count < 10; r++) {
          if (!getHex({ q, r })) {
            const hex = createHex({ q, r });
            const populated = populateHex(
              hex,
              campaign.terrainTypes,
              campaign.encounterTables,
              { generateTerrain: generateTerrainEnabled, generateEncounter: generateEncounterEnabled }
            );
            results.push(`(${q}, ${r}): ${populated.terrain}`);
            count++;
          }
        }
      }
      if (count >= 10) {
        results.push('... and more');
      }
    }

    setPreview(results);
  };

  const handleApply = () => {
    if (!campaign) return;

    if (target === 'selected' && selectedCoordinate) {
      const existing = getHex(selectedCoordinate);
      let hex: Hex = existing ?? createHex(selectedCoordinate);

      const populated = populateHex(
        hex,
        campaign.terrainTypes,
        campaign.encounterTables,
        { generateTerrain: generateTerrainEnabled, generateEncounter: generateEncounterEnabled }
      );

      updateHex(populated);
    } else if (target === 'allEmpty') {
      for (let q = 0; q < campaign.gridWidth; q++) {
        for (let r = 0; r < campaign.gridHeight; r++) {
          if (!getHex({ q, r })) {
            const hex = createHex({ q, r });
            const populated = populateHex(
              hex,
              campaign.terrainTypes,
              campaign.encounterTables,
              { generateTerrain: generateTerrainEnabled, generateEncounter: generateEncounterEnabled }
            );
            updateHex(populated);
          }
        }
      }
    }

    onClose();
  };

  const canApply = target === 'allEmpty' || (target === 'selected' && selectedCoordinate);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Generate Content</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label>Target</label>
            <select value={target} onChange={(e) => setTarget(e.target.value as GeneratorTarget)}>
              <option value="selected">Selected Hex</option>
              <option value="allEmpty">All Empty Hexes</option>
            </select>
            {target === 'selected' && !selectedCoordinate && (
              <p className="hint warning">No hex selected</p>
            )}
          </div>

          <div className="field-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={generateTerrainEnabled}
                onChange={(e) => setGenerateTerrainEnabled(e.target.checked)}
              />
              Generate Terrain
            </label>
          </div>

          <div className="field-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={generateEncounterEnabled}
                onChange={(e) => setGenerateEncounterEnabled(e.target.checked)}
              />
              Generate Encounter
            </label>
          </div>

          {preview.length > 0 && (
            <div className="preview-box">
              <h4>Preview</h4>
              <pre>{preview.join('\n')}</pre>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handlePreview}>
            Preview
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleApply} disabled={!canApply}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default GeneratorModal;
