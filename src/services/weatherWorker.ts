// WebWorker entry point for weather simulation
// Runs simulation engine in a separate thread, posting field updates to main thread

import type { WorkerInMessage, WorkerOutMessage } from './weatherWorkerProtocol';
import type { WeatherSimulator } from './weather/WeatherSimulator';
import { PerlinWeatherEngine } from './weather/PerlinWeatherEngine';
import { FluidWeatherEngine } from './weather/FluidWeatherEngine';

let engine: WeatherSimulator | null = null;
let tickInterval: ReturnType<typeof setInterval> | null = null;
let paused = false;

function postMsg(msg: WorkerOutMessage) {
  self.postMessage(msg);
}

function startTicking(speed: number) {
  stopTicking();
  if (paused) return;
  // Tick rate: ~10fps base, scaled by simulation speed
  const intervalMs = Math.max(50, 100 / Math.max(1, speed));
  tickInterval = setInterval(() => {
    if (!engine || paused) return;
    try {
      const result = engine.tick();
      postMsg({
        type: 'FIELD_UPDATE',
        field: result.field,
        pressureSystems: result.pressureSystems,
        fronts: result.fronts,
        activeEvents: result.activeEvents
      });
      // Notify about spawned/ended events
      for (const event of result.spawnedEvents) {
        postMsg({ type: 'EVENT_SPAWNED', event });
      }
      for (const eventId of result.endedEventIds) {
        postMsg({ type: 'EVENT_ENDED', eventId });
      }
    } catch (err) {
      postMsg({ type: 'ERROR', message: String(err) });
    }
  }, intervalMs);
}

function stopTicking() {
  if (tickInterval !== null) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'INIT': {
      // Create engine based on config
      if (msg.config.engineType === 'fluid') {
        engine = new FluidWeatherEngine();
      } else {
        engine = new PerlinWeatherEngine();
      }
      engine.init(msg.grid, msg.seed, msg.config);
      paused = false;
      postMsg({ type: 'READY' });
      startTicking(msg.config.simulationSpeed);
      break;
    }

    case 'TICK': {
      if (!engine || paused) break;
      const result = engine.tick();
      postMsg({
        type: 'FIELD_UPDATE',
        field: result.field,
        pressureSystems: result.pressureSystems,
        fronts: result.fronts,
        activeEvents: result.activeEvents
      });
      break;
    }

    case 'SET_CONFIG': {
      if (!engine) break;
      engine.setConfig(msg.config);
      if (msg.config.simulationSpeed !== undefined) {
        startTicking(msg.config.simulationSpeed);
      }
      break;
    }

    case 'SPAWN_EVENT': {
      if (!engine) break;
      const event = engine.spawnEvent(msg.eventType, msg.centerKey, msg.intensity, msg.durationTicks);
      postMsg({ type: 'EVENT_SPAWNED', event });
      break;
    }

    case 'CANCEL_EVENT': {
      if (!engine) break;
      engine.cancelEvent(msg.eventId);
      break;
    }

    case 'UPDATE_TERRAIN': {
      if (!engine) break;
      engine.updateTerrain(msg.hexes);
      break;
    }

    case 'PAUSE': {
      paused = true;
      stopTicking();
      break;
    }

    case 'RESUME': {
      paused = false;
      if (engine) {
        const field = engine.getField();
        postMsg({
          type: 'FIELD_UPDATE',
          field,
          pressureSystems: [],
          fronts: [],
          activeEvents: []
        });
        startTicking(3); // Default speed; will be updated by SET_CONFIG
      }
      break;
    }

    case 'DESTROY': {
      stopTicking();
      engine?.reset();
      engine = null;
      break;
    }
  }
};
