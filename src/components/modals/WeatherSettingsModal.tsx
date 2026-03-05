// WeatherSettingsModal - Modal for weather configuration
import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { useWeatherSimulation } from '../../stores/WeatherSimulationContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { getWeatherSummary, describeWeather } from '../../services/weather';
import Icon from '../icons/Icon';
import { getWeatherEffects } from '../../data/weatherEffects';
import { WEATHER_EVENT_DEFS } from '../../services/weather/WeatherEvents';
import type { WeatherEventType, WeatherSimulationConfig } from '../../types/Weather';
import {
  Weather,
  WeatherCondition,
  Temperature,
  WindStrength,
  PrecipitationLevel,
  WEATHER_ICONS,
  WEATHER_CONDITION_LABELS
} from '../../types/Weather';

interface WeatherSettingsModalProps {
  onClose: () => void;
}

const CONDITION_OPTIONS: WeatherCondition[] = [
  'clear', 'partly-cloudy', 'cloudy', 'overcast',
  'light-rain', 'rain', 'heavy-rain', 'thunderstorm',
  'drizzle', 'fog', 'mist',
  'light-snow', 'snow', 'heavy-snow', 'blizzard',
  'hail', 'sleet',
  'windy', 'hot', 'cold', 'freezing'
];

const TEMPERATURE_OPTIONS: Temperature[] = [
  'freezing', 'cold', 'cool', 'mild', 'warm', 'hot', 'scorching'
];

const WIND_OPTIONS: WindStrength[] = [
  'calm', 'light', 'moderate', 'strong', 'gale'
];

const PRECIPITATION_OPTIONS: PrecipitationLevel[] = [
  'none', 'light', 'moderate', 'heavy'
];

function WeatherSettingsModal({ onClose }: WeatherSettingsModalProps) {
  const {
    campaign,
    timeWeather,
    currentSeason,
    weatherSummary,
    setGlobalWeather,
    generateNewWeather,
    updateWeatherSettings,
    updateCampaignData,
    initTimeWeather
  } = useCampaign();
  const weatherSim = useWeatherSimulation();
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  const simConfig = campaign?.weatherSimulation?.config;

  // Local state for weather editing
  const [editingWeather, setEditingWeather] = useState<Weather | null>(null);

  // If no timeWeather, show setup
  if (!timeWeather) {
    return (
      <div
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weather-setup-modal-title"
      >
        <div ref={focusTrapRef} className="modal weather-settings-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 id="weather-setup-modal-title">Weather Settings</h2>
            <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
          </div>
          <div className="modal-body">
            <p>Time and weather tracking is not enabled for this campaign.</p>
            <p>Enable it to manage weather conditions.</p>
            <button className="btn btn-primary" onClick={() => { initTimeWeather(); }}>
              Enable Time & Weather Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentWeather = timeWeather.globalWeather;
  const weatherToEdit = editingWeather || currentWeather;
  const weatherIconName = WEATHER_ICONS[currentWeather.condition] || 'cloud-partial';

  const handleConditionChange = (condition: WeatherCondition) => {
    setEditingWeather({ ...weatherToEdit, condition });
  };

  const handleTemperatureChange = (temperature: Temperature) => {
    setEditingWeather({ ...weatherToEdit, temperature });
  };

  const handleWindChange = (wind: WindStrength) => {
    setEditingWeather({ ...weatherToEdit, wind });
  };

  const handlePrecipitationChange = (precipitation: PrecipitationLevel) => {
    setEditingWeather({ ...weatherToEdit, precipitation });
  };

  const handleApplyWeather = () => {
    if (editingWeather) {
      setGlobalWeather(editingWeather);
      setEditingWeather(null);
    }
  };

  const handleRandomWeather = () => {
    generateNewWeather();
    setEditingWeather(null);
  };

  const handleDynamicToggle = (enabled: boolean) => {
    updateWeatherSettings({ dynamicWeather: enabled });
  };

  const handleSeasonalToggle = (enabled: boolean) => {
    updateWeatherSettings({ seasonalEffects: enabled });
  };

  const handleIntervalChange = (hours: number) => {
    updateWeatherSettings({ weatherChangeInterval: Math.max(1, hours) });
  };

  const handleSimConfigChange = (changes: Partial<WeatherSimulationConfig>) => {
    if (!campaign?.weatherSimulation) return;
    const newConfig = { ...campaign.weatherSimulation.config, ...changes };
    updateCampaignData({
      weatherSimulation: {
        ...campaign.weatherSimulation,
        config: newConfig
      }
    });
    // Sync to the running worker
    if (weatherSim.isRunning) {
      weatherSim.setConfig(changes);
    }
  };

  const handleSpawnEvent = (type: WeatherEventType) => {
    if (!weatherSim.isRunning || !campaign) return;
    // Spawn at grid center
    const cx = Math.floor(campaign.gridWidth / 2);
    const cy = Math.floor(campaign.gridHeight / 2);
    weatherSim.spawnEvent(type, `${cx},${cy}`);
  };

  const effects = getWeatherEffects(weatherToEdit);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="weather-settings-modal-title"
    >
      <div ref={focusTrapRef} className="modal weather-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="weather-settings-modal-title">Weather Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          {/* Current Weather Display */}
          <div className="weather-settings-current">
            <div className="weather-settings-display">
              <span className="weather-icon-large"><Icon name={weatherIconName} size={48} /></span>
              <div className="weather-details">
                <h3>{weatherSummary}</h3>
                <p>{describeWeather(currentWeather)}</p>
                {currentSeason && <p className="weather-season">Season: {currentSeason}</p>}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={handleRandomWeather}>
              <Icon name="dice" size={16} /> Generate Random
            </button>
          </div>

          {/* Weather Editor */}
          <div className="weather-settings-editor">
            <h4>Set Custom Weather</h4>

            <div className="form-group">
              <label htmlFor="weather-condition">Condition</label>
              <select
                id="weather-condition"
                value={weatherToEdit.condition}
                onChange={(e) => handleConditionChange(e.target.value as WeatherCondition)}
              >
                {CONDITION_OPTIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {WEATHER_ICONS[condition]} {WEATHER_CONDITION_LABELS[condition]}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="weather-temperature">Temperature</label>
                <select
                  id="weather-temperature"
                  value={weatherToEdit.temperature}
                  onChange={(e) => handleTemperatureChange(e.target.value as Temperature)}
                >
                  {TEMPERATURE_OPTIONS.map((temp) => (
                    <option key={temp} value={temp}>
                      {temp.charAt(0).toUpperCase() + temp.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="weather-wind">Wind</label>
                <select
                  id="weather-wind"
                  value={weatherToEdit.wind}
                  onChange={(e) => handleWindChange(e.target.value as WindStrength)}
                >
                  {WIND_OPTIONS.map((wind) => (
                    <option key={wind} value={wind}>
                      {wind.charAt(0).toUpperCase() + wind.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="weather-precipitation">Precipitation</label>
                <select
                  id="weather-precipitation"
                  value={weatherToEdit.precipitation}
                  onChange={(e) => handlePrecipitationChange(e.target.value as PrecipitationLevel)}
                >
                  {PRECIPITATION_OPTIONS.map((precip) => (
                    <option key={precip} value={precip}>
                      {precip.charAt(0).toUpperCase() + precip.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Effects */}
            <div className="weather-effects-preview">
              <h5>Effects Preview</h5>
              <ul>
                <li>
                  <span className="effect-label">Travel:</span>
                  <span className="effect-value">
                    {effects.travelModifier === 1 ? 'Normal' :
                      effects.travelModifier > 1 ? `${Math.round((effects.travelModifier - 1) * 100)}% slower` :
                        `${Math.round((1 - effects.travelModifier) * 100)}% faster`}
                  </span>
                </li>
                <li>
                  <span className="effect-label">Visibility:</span>
                  <span className="effect-value">
                    {effects.visibilityModifier === 1 ? 'Normal' :
                      `${Math.round(effects.visibilityModifier * 100)}%`}
                  </span>
                </li>
                <li>
                  <span className="effect-label">Encounters:</span>
                  <span className="effect-value">
                    {effects.encounterModifier === 1 ? 'Normal' :
                      effects.encounterModifier > 1 ? `${Math.round((effects.encounterModifier - 1) * 100)}% more likely` :
                        `${Math.round((1 - effects.encounterModifier) * 100)}% less likely`}
                  </span>
                </li>
              </ul>
              <p className="effect-description">{effects.description}</p>
            </div>

            {editingWeather && (
              <div className="weather-settings-actions">
                <button className="btn btn-primary" onClick={handleApplyWeather}>
                  Apply Weather
                </button>
                <button className="btn" onClick={() => setEditingWeather(null)}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Weather Settings */}
          <div className="weather-settings-dynamic">
            <h4>Automatic Weather</h4>

            <div className="form-group form-checkbox">
              <label htmlFor="weather-dynamic">
                <input
                  id="weather-dynamic"
                  type="checkbox"
                  checked={timeWeather.dynamicWeather}
                  onChange={(e) => handleDynamicToggle(e.target.checked)}
                />
                Enable dynamic weather changes
              </label>
              <span className="form-hint">Weather will change automatically as time advances</span>
            </div>

            <div className="form-group form-checkbox">
              <label htmlFor="weather-seasonal">
                <input
                  id="weather-seasonal"
                  type="checkbox"
                  checked={timeWeather.seasonalEffects}
                  onChange={(e) => handleSeasonalToggle(e.target.checked)}
                />
                Enable seasonal effects
              </label>
              <span className="form-hint">Weather patterns will be affected by the current season</span>
            </div>

            <div className="form-group">
              <label htmlFor="weather-change-interval">Weather change interval (hours)</label>
              <input
                id="weather-change-interval"
                type="number"
                min={1}
                max={168}
                value={timeWeather.weatherChangeInterval}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value) || 6)}
              />
              <span className="form-hint">How often weather may change when time advances</span>
            </div>
          </div>

          {/* Weather Simulation Settings */}
          {campaign?.weatherSimulation && (
            <div className="weather-sim-panel">
              <h4>Weather Simulation (Radar Overlay)</h4>
              <div className="weather-sim-controls">
                <div className="weather-sim-row">
                  <label htmlFor="sim-engine">Engine</label>
                  <select
                    id="sim-engine"
                    value={simConfig?.engineType || 'perlin'}
                    onChange={(e) => handleSimConfigChange({ engineType: e.target.value as 'fluid' | 'perlin' })}
                  >
                    <option value="perlin">Perlin (Lightweight)</option>
                    <option value="fluid">Fluid Dynamics (Full)</option>
                  </select>
                </div>

                <div className="weather-sim-row">
                  <label htmlFor="sim-speed">Sim Speed</label>
                  <input
                    id="sim-speed"
                    type="range"
                    min={1}
                    max={10}
                    value={simConfig?.simulationSpeed || 3}
                    onChange={(e) => handleSimConfigChange({ simulationSpeed: parseInt(e.target.value) })}
                  />
                  <span>{simConfig?.simulationSpeed || 3}x</span>
                </div>

                <div className="weather-sim-row">
                  <label htmlFor="sim-opacity">Overlay Opacity</label>
                  <input
                    id="sim-opacity"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((simConfig?.overlayOpacity || 0.35) * 100)}
                    onChange={(e) => handleSimConfigChange({ overlayOpacity: parseInt(e.target.value) / 100 })}
                  />
                  <span>{Math.round((simConfig?.overlayOpacity || 0.35) * 100)}%</span>
                </div>

                <div className="weather-sim-row">
                  <label htmlFor="sim-overlay-mode">Overlay Mode</label>
                  <select
                    id="sim-overlay-mode"
                    value={simConfig?.overlayMode || 'precipitation'}
                    onChange={(e) => handleSimConfigChange({ overlayMode: e.target.value as WeatherSimulationConfig['overlayMode'] })}
                  >
                    <option value="precipitation">Precipitation Radar</option>
                    <option value="temperature">Temperature Map</option>
                    <option value="pressure">Pressure Map</option>
                    <option value="wind">Wind Speed</option>
                  </select>
                </div>

                <div className="weather-sim-row">
                  <label htmlFor="sim-particles">Particle Density</label>
                  <input
                    id="sim-particles"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round((simConfig?.particleDensity || 0.5) * 100)}
                    onChange={(e) => handleSimConfigChange({ particleDensity: parseInt(e.target.value) / 100 })}
                  />
                  <span>{Math.round((simConfig?.particleDensity || 0.5) * 100)}%</span>
                </div>

                <div className="weather-sim-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={simConfig?.showIsobars || false}
                      onChange={(e) => handleSimConfigChange({ showIsobars: e.target.checked })}
                    />
                    Show isobars (pressure contours)
                  </label>
                </div>

                <div className="weather-sim-row">
                  <label>
                    <input
                      type="checkbox"
                      checked={simConfig?.showFronts || false}
                      onChange={(e) => handleSimConfigChange({ showFronts: e.target.checked })}
                    />
                    Show weather fronts
                  </label>
                </div>

                {/* Spawn weather event */}
                <div style={{ marginTop: 8 }}>
                  <label style={{ fontSize: 12, color: '#999' }}>Spawn Weather Event</label>
                  <div className="weather-event-spawner">
                    {(Object.keys(WEATHER_EVENT_DEFS) as WeatherEventType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSpawnEvent(type)}
                        disabled={!weatherSim.isRunning}
                        title={WEATHER_EVENT_DEFS[type].description}
                      >
                        {WEATHER_EVENT_DEFS[type].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weather History */}
          {timeWeather.weatherHistory.length > 0 && (
            <div className="weather-settings-history">
              <h4>Recent Weather History</h4>
              <ul className="weather-history-list">
                {timeWeather.weatherHistory.slice(-5).reverse().map((entry, index) => (
                  <li key={index}>
                    <span className="history-icon">{WEATHER_ICONS[entry.weather.condition]}</span>
                    <span className="history-condition">{getWeatherSummary(entry.weather)}</span>
                    {entry.notes && <span className="history-notes">- {entry.notes}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default WeatherSettingsModal;
