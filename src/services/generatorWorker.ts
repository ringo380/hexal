// WebWorker entry point for procedural generation
// Runs generation in a separate thread, posting progress updates to main thread

import type { GeneratorInMessage, GeneratorOutMessage } from './generatorWorkerProtocol';
import {
  generateBiomeTerrain,
  populateHex,
  generateRivers,
  generateRoads,
} from './generator';
import { SeededRNG, stringToSeed } from './rng';

function postMsg(msg: GeneratorOutMessage) {
  self.postMessage(msg);
}

self.onmessage = (e: MessageEvent<GeneratorInMessage>) => {
  const msg = e.data;

  if (msg.type === 'GENERATE_ALL_EMPTY') {
    try {
      const {
        hexes: inputHexes,
        terrainTypes,
        encounterTables,
        landmarkTables,
        gridWidth,
        gridHeight,
        config,
        seed,
        generateTerrain,
        generateEncounters,
        generateLandmarks,
        generateRivers: doRivers,
        generateRoads: doRoads,
        encounterDensity,
        landmarkDensity,
      } = msg.payload;

      const numericSeed = seed ? stringToSeed(seed) : Math.floor(Math.random() * 4294967296);
      const rng = new SeededRNG(numericSeed);

      // Step 1: Generate biome terrain
      postMsg({ type: 'PROGRESS', step: 'Generating terrain...', percent: 0 });
      let hexes = generateTerrain
        ? generateBiomeTerrain(inputHexes, terrainTypes, gridWidth, gridHeight, config, rng)
        : { ...inputHexes };

      // Step 2: Populate encounters and landmarks
      if (generateEncounters || generateLandmarks) {
        postMsg({ type: 'PROGRESS', step: 'Populating content...', percent: 30 });
        const contentRng = rng.fork('content');
        for (let q = 0; q < gridWidth; q++) {
          for (let r = 0; r < gridHeight; r++) {
            const key = `${q},${r}`;
            const hex = hexes[key];
            if (!hex || !hex.terrain) continue;
            if (inputHexes[key]?.encounters.length || inputHexes[key]?.locations.length) continue;

            hexes[key] = populateHex(
              hex,
              terrainTypes,
              encounterTables,
              {
                generateTerrain: false,
                generateEncounter: generateEncounters,
                generateLandmark: generateLandmarks,
                encounterDensity,
                landmarkDensity,
              },
              contentRng,
              landmarkTables
            );
          }
        }
      }

      // Step 3: Generate rivers
      if (doRivers) {
        postMsg({ type: 'PROGRESS', step: 'Generating rivers...', percent: 60 });
        hexes = generateRivers(hexes, gridWidth, gridHeight, rng.fork('rivers'), undefined, terrainTypes);
      }

      // Step 4: Generate roads
      if (doRoads) {
        postMsg({ type: 'PROGRESS', step: 'Generating roads...', percent: 80 });
        hexes = generateRoads(hexes, gridWidth, gridHeight, rng.fork('roads'), undefined, terrainTypes);
      }

      postMsg({ type: 'PROGRESS', step: 'Complete', percent: 100 });
      postMsg({ type: 'COMPLETE', hexes });
    } catch (err) {
      postMsg({ type: 'ERROR', message: err instanceof Error ? err.message : String(err) });
    }
  }
};
