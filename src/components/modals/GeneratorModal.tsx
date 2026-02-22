// GeneratorModal - Content generation dialog with biome-aware terrain,
// seeded RNG, landmark generation, and river/road networks
import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useSelection } from '../../stores/SelectionContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAnnounce } from '../../stores/AnnouncerContext';
import {
  populateHex,
  generateBiomeTerrain,
  neighborAwareTerrain,
  generateRivers,
  generateRoads,
} from '../../services/generator';
import { SeededRNG, stringToSeed } from '../../services/rng';
import type { Hex, GenerationConfig } from '../../types';
import { createHex, createDefaultGenerationConfig } from '../../types';

type GeneratorTarget = 'selected' | 'allEmpty';

interface GeneratorModalProps {
  onClose: () => void;
}

function GeneratorModal({ onClose }: GeneratorModalProps) {
  const { campaign, getHex, updateHex, updateCampaignData } = useCampaign();
  const { selectedCoordinate } = useSelection();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const announce = useAnnounce();

  const [target, setTarget] = useState<GeneratorTarget>('selected');
  const [generateTerrainEnabled, setGenerateTerrainEnabled] = useState(true);
  const [generateEncounterEnabled, setGenerateEncounterEnabled] = useState(true);
  const [generateLandmarkEnabled, setGenerateLandmarkEnabled] = useState(false);
  const [generateRiversEnabled, setGenerateRiversEnabled] = useState(false);
  const [generateRoadsEnabled, setGenerateRoadsEnabled] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);

  // Generation config state
  const savedConfig = campaign?.generationConfig ?? createDefaultGenerationConfig();
  const [seed, setSeed] = useState(savedConfig.seed);
  const [clusterStrength, setClusterStrength] = useState(savedConfig.biomeClusteringStrength);
  const [terrainVariety, setTerrainVariety] = useState(savedConfig.terrainVariety);
  const [encounterDensity, setEncounterDensity] = useState(savedConfig.encounterDensity);
  const [landmarkDensity, setLandmarkDensity] = useState(savedConfig.landmarkDensity);

  const randomizeSeed = () => {
    setSeed(Math.random().toString(36).substring(2, 10));
  };

  const createRng = (): SeededRNG => {
    const numericSeed = seed ? stringToSeed(seed) : Math.floor(Math.random() * 4294967296);
    return new SeededRNG(numericSeed);
  };

  const currentConfig = (): GenerationConfig => ({
    seed,
    biomeClusteringStrength: clusterStrength,
    encounterDensity,
    landmarkDensity,
    terrainVariety,
  });

  const handlePreview = () => {
    if (!campaign) return;

    const results: string[] = [];
    const rng = createRng();

    if (target === 'selected' && selectedCoordinate) {
      const existing = getHex(selectedCoordinate);
      let hex: Hex = existing ?? createHex(selectedCoordinate);

      if (generateTerrainEnabled) {
        hex = { ...hex, terrain: neighborAwareTerrain(
          selectedCoordinate,
          campaign.hexes,
          campaign.terrainTypes,
          campaign.gridWidth,
          campaign.gridHeight,
          rng
        )};
      }

      const populated = populateHex(
        hex,
        campaign.terrainTypes,
        campaign.encounterTables,
        {
          generateTerrain: false,
          generateEncounter: generateEncounterEnabled,
          generateLandmark: generateLandmarkEnabled,
          encounterDensity,
          landmarkDensity,
        },
        rng,
        campaign.landmarkTables
      );

      results.push(`(${selectedCoordinate.q}, ${selectedCoordinate.r}): ${populated.terrain}`);
      if (populated.encounters.length > (existing?.encounters.length ?? 0)) {
        const newEnc = populated.encounters[populated.encounters.length - 1];
        results.push(`  + Encounter: ${newEnc.title}`);
      }
      if (populated.locations.length > (existing?.locations.length ?? 0)) {
        const newLoc = populated.locations[populated.locations.length - 1];
        results.push(`  + Landmark: ${newLoc.title}`);
      }
    } else if (target === 'allEmpty') {
      // Preview biome terrain generation
      const terrainResult = generateTerrainEnabled
        ? generateBiomeTerrain(campaign.hexes, campaign.terrainTypes, campaign.gridWidth, campaign.gridHeight, currentConfig(), rng)
        : { ...campaign.hexes };

      let count = 0;
      for (let q = 0; q < campaign.gridWidth && count < 10; q++) {
        for (let r = 0; r < campaign.gridHeight && count < 10; r++) {
          const key = `${q},${r}`;
          const hex = terrainResult[key];
          if (hex && hex.terrain && !campaign.hexes[key]?.terrain) {
            results.push(`(${q}, ${r}): ${hex.terrain}`);
            count++;
          }
        }
      }
      if (count >= 10) {
        results.push('... and more');
      }
      if (generateRiversEnabled) results.push('+ Rivers will be generated');
      if (generateRoadsEnabled) results.push('+ Roads will be generated');
    }

    setPreview(results);
  };

  const handleApply = () => {
    if (!campaign) return;

    const rng = createRng();
    const config = currentConfig();

    // Save config to campaign
    updateCampaignData({ generationConfig: config });

    if (target === 'selected' && selectedCoordinate) {
      const existing = getHex(selectedCoordinate);
      let hex: Hex = existing ?? createHex(selectedCoordinate);

      if (generateTerrainEnabled) {
        hex = { ...hex, terrain: neighborAwareTerrain(
          selectedCoordinate,
          campaign.hexes,
          campaign.terrainTypes,
          campaign.gridWidth,
          campaign.gridHeight,
          rng
        )};
      }

      const populated = populateHex(
        hex,
        campaign.terrainTypes,
        campaign.encounterTables,
        {
          generateTerrain: false,
          generateEncounter: generateEncounterEnabled,
          generateLandmark: generateLandmarkEnabled,
          encounterDensity,
          landmarkDensity,
        },
        rng,
        campaign.landmarkTables
      );

      updateHex(populated);
    } else if (target === 'allEmpty') {
      // Step 1: Generate biome terrain (whole grid, single batch)
      let hexes = generateTerrainEnabled
        ? generateBiomeTerrain(campaign.hexes, campaign.terrainTypes, campaign.gridWidth, campaign.gridHeight, config, rng)
        : { ...campaign.hexes };

      // Step 2: Populate encounters and landmarks
      if (generateEncounterEnabled || generateLandmarkEnabled) {
        const contentRng = rng.fork('content');
        for (let q = 0; q < campaign.gridWidth; q++) {
          for (let r = 0; r < campaign.gridHeight; r++) {
            const key = `${q},${r}`;
            const hex = hexes[key];
            if (!hex || !hex.terrain) continue;
            // Only populate hexes that were empty before
            if (campaign.hexes[key]?.encounters.length || campaign.hexes[key]?.locations.length) continue;

            hexes[key] = populateHex(
              hex,
              campaign.terrainTypes,
              campaign.encounterTables,
              {
                generateTerrain: false,
                generateEncounter: generateEncounterEnabled,
                generateLandmark: generateLandmarkEnabled,
                encounterDensity,
                landmarkDensity,
              },
              contentRng,
              campaign.landmarkTables
            );
          }
        }
      }

      // Step 3: Generate rivers
      if (generateRiversEnabled) {
        hexes = generateRivers(hexes, campaign.gridWidth, campaign.gridHeight, rng.fork('rivers'), undefined, campaign.terrainTypes);
      }

      // Step 4: Generate roads
      if (generateRoadsEnabled) {
        hexes = generateRoads(hexes, campaign.gridWidth, campaign.gridHeight, rng.fork('roads'), undefined, campaign.terrainTypes);
      }

      // Single batch update — one undo state, one autosave
      updateCampaignData({ hexes });
    }

    announce('Content generation complete', 'assertive');
    onClose();
  };

  const canApply = target === 'allEmpty' || (target === 'selected' && selectedCoordinate);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generator-modal-title"
    >
      <div ref={focusTrapRef} className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="generator-modal-title">Generate Content</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {/* Target selection */}
          <div className="field-group">
            <label htmlFor="gen-target">Target</label>
            <select id="gen-target" value={target} onChange={(e) => setTarget(e.target.value as GeneratorTarget)}>
              <option value="selected">Selected Hex</option>
              <option value="allEmpty">All Empty Hexes</option>
            </select>
            {target === 'selected' && !selectedCoordinate && (
              <p className="hint warning">No hex selected</p>
            )}
          </div>

          {/* Seed input */}
          <div className="field-group">
            <label htmlFor="gen-seed">Seed</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="gen-seed"
                type="text"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Random (leave empty)"
                style={{ flex: 1 }}
              />
              <button className="btn btn-small btn-secondary" onClick={randomizeSeed}>
                Randomize
              </button>
            </div>
            <p className="hint">Same seed produces identical results</p>
          </div>

          {/* Content toggles */}
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

          {generateTerrainEnabled && target === 'allEmpty' && (
            <>
              <div className="field-group" style={{ paddingLeft: '20px' }}>
                <label htmlFor="gen-clustering">
                  Clustering Strength: {Math.round(clusterStrength * 100)}%
                </label>
                <input
                  id="gen-clustering"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={clusterStrength}
                  onChange={(e) => setClusterStrength(parseFloat(e.target.value))}
                />
                <p className="hint">Higher = larger terrain clusters</p>
              </div>

              <div className="field-group" style={{ paddingLeft: '20px' }}>
                <label htmlFor="gen-variety">
                  Terrain Variety: {Math.round(terrainVariety * 100)}%
                </label>
                <input
                  id="gen-variety"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={terrainVariety}
                  onChange={(e) => setTerrainVariety(parseFloat(e.target.value))}
                />
                <p className="hint">Higher = more evenly distributed terrain types</p>
              </div>
            </>
          )}

          <div className="field-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={generateEncounterEnabled}
                onChange={(e) => setGenerateEncounterEnabled(e.target.checked)}
              />
              Generate Encounters
            </label>
          </div>

          {generateEncounterEnabled && (
            <div className="field-group" style={{ paddingLeft: '20px' }}>
              <label htmlFor="gen-encounter-density">
                Encounter Density: {Math.round(encounterDensity * 100)}%
              </label>
              <input
                id="gen-encounter-density"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={encounterDensity}
                onChange={(e) => setEncounterDensity(parseFloat(e.target.value))}
              />
            </div>
          )}

          <div className="field-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={generateLandmarkEnabled}
                onChange={(e) => setGenerateLandmarkEnabled(e.target.checked)}
              />
              Generate Landmarks
            </label>
          </div>

          {generateLandmarkEnabled && (
            <div className="field-group" style={{ paddingLeft: '20px' }}>
              <label htmlFor="gen-landmark-density">
                Landmark Density: {Math.round(landmarkDensity * 100)}%
              </label>
              <input
                id="gen-landmark-density"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={landmarkDensity}
                onChange={(e) => setLandmarkDensity(parseFloat(e.target.value))}
              />
            </div>
          )}

          {target === 'allEmpty' && (
            <>
              <div className="field-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generateRiversEnabled}
                    onChange={(e) => setGenerateRiversEnabled(e.target.checked)}
                  />
                  Generate Rivers
                </label>
              </div>

              <div className="field-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={generateRoadsEnabled}
                    onChange={(e) => setGenerateRoadsEnabled(e.target.checked)}
                  />
                  Generate Roads
                </label>
              </div>
            </>
          )}

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
