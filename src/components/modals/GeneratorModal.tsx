// GeneratorModal - Content generation dialog with biome-aware terrain,
// seeded RNG, landmark generation, and river/road networks
import { useState, useRef, useEffect } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useHexSelection } from '../../stores/HexSelectionContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAnnounce } from '../../stores/AnnouncerContext';
import {
  populateHex,
  generateBiomeTerrain,
  neighborAwareTerrain,
} from '../../services/generator';
import { SeededRNG, stringToSeed } from '../../services/rng';
import type { GeneratorOutMessage } from '../../services/generatorWorkerProtocol';
import type { Hex, GenerationConfig } from '../../types';
import { createHex, createDefaultGenerationConfig } from '../../types';
import Icon from '../icons/Icon';

type GeneratorTarget = 'selected' | 'allEmpty';

interface GeneratorModalProps {
  onClose: () => void;
}

function GeneratorModal({ onClose }: GeneratorModalProps) {
  const { campaign, getHex, updateHex, updateCampaignData } = useCampaign();
  const { selectedCoordinate } = useHexSelection();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const announce = useAnnounce();

  const [target, setTarget] = useState<GeneratorTarget>('selected');
  const [generateTerrainEnabled, setGenerateTerrainEnabled] = useState(true);
  const [generateEncounterEnabled, setGenerateEncounterEnabled] = useState(true);
  const [generateLandmarkEnabled, setGenerateLandmarkEnabled] = useState(false);
  const [generateRiversEnabled, setGenerateRiversEnabled] = useState(false);
  const [generateRoadsEnabled, setGenerateRoadsEnabled] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

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
    setIsGenerating(true);
    setProgressStep('Starting...');
    setProgressPercent(0);

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
      setIsGenerating(false);
      announce('Content generation complete', 'assertive');
      onClose();
    } else if (target === 'allEmpty') {
      // Run generation in a web worker to keep the UI responsive
      const worker = new Worker(
        new URL('../../services/generatorWorker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<GeneratorOutMessage>) => {
        const msg = e.data;
        switch (msg.type) {
          case 'PROGRESS':
            setProgressStep(msg.step);
            setProgressPercent(msg.percent);
            break;
          case 'COMPLETE':
            updateCampaignData({ hexes: msg.hexes });
            setIsGenerating(false);
            worker.terminate();
            workerRef.current = null;
            announce('Content generation complete', 'assertive');
            onClose();
            break;
          case 'ERROR':
            console.error('Generation worker error:', msg.message);
            setIsGenerating(false);
            worker.terminate();
            workerRef.current = null;
            break;
        }
      };

      worker.postMessage({
        type: 'GENERATE_ALL_EMPTY',
        payload: {
          hexes: campaign.hexes,
          terrainTypes: campaign.terrainTypes,
          encounterTables: campaign.encounterTables,
          landmarkTables: campaign.landmarkTables,
          gridWidth: campaign.gridWidth,
          gridHeight: campaign.gridHeight,
          config,
          seed: seed || Math.random().toString(36).substring(2, 10),
          generateTerrain: generateTerrainEnabled,
          generateEncounters: generateEncounterEnabled,
          generateLandmarks: generateLandmarkEnabled,
          generateRivers: generateRiversEnabled,
          generateRoads: generateRoadsEnabled,
          encounterDensity,
          landmarkDensity,
        },
      });
    }
  };

  const canApply = !isGenerating && (target === 'allEmpty' || (target === 'selected' && selectedCoordinate));

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
                  title="Controls how much similar terrain types group together. Higher values create larger, more cohesive biomes."
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
                  title="Controls the distribution of terrain types. Higher values spread types more evenly; lower values favor dominant terrains."
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
                title="Probability that each hex receives a random encounter. Higher values mean more hexes will have encounters."
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
                title="Probability that each hex receives a landmark. Higher values mean more hexes will have notable locations."
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

          {isGenerating && (
            <div className="generation-progress">
              <div className="generation-progress-label">
                <Icon name="spinner" size={14} /> {progressStep}
              </div>
              <div className="generation-progress-bar">
                <div
                  className="generation-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handlePreview} disabled={isGenerating}>
            Preview
          </button>
          <button className="btn btn-secondary" onClick={onClose} disabled={isGenerating}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleApply} disabled={!canApply}>
            {isGenerating ? <><Icon name="spinner" size={14} /> Generating...</> : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GeneratorModal;
