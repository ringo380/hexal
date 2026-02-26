// TimeWeatherBar - Compact toolbar display for time and weather
import { useCampaign } from '../stores/CampaignContext';
import { useWeatherSimulation } from '../stores/WeatherSimulationContext';
import {
  WEATHER_ICONS,
  SEASON_ICONS
} from '../types/Weather';
import { getTimeOfDayIcon } from '../services/time';
import Icon from './icons/Icon';
import WeatherRadarToggle from './weather/WeatherRadarToggle';
import WeatherEventBadge from './weather/WeatherEventBadge';

interface TimeWeatherBarProps {
  onOpenTimeControls: () => void;
  onOpenWeatherSettings: () => void;
}

function TimeWeatherBar({ onOpenTimeControls, onOpenWeatherSettings }: TimeWeatherBarProps) {
  const {
    timeWeather,
    campaign,
    currentSeason,
    currentTimeOfDay,
    formattedTime,
    formattedDate,
    weatherSummary,
    advanceTimeBy,
    generateNewWeather,
    initTimeWeather,
    updateCampaignData
  } = useCampaign();

  const weatherSim = useWeatherSimulation();

  const simConfig = campaign?.weatherSimulation?.config;

  // If no time/weather initialized, show setup button
  if (!timeWeather) {
    return (
      <div className="time-weather-bar time-weather-bar--setup">
        <button
          className="btn btn-small btn-primary"
          onClick={initTimeWeather}
          title="Enable time & weather tracking"
        >
          <Icon name="clock" size={14} /> Enable Time & Weather
        </button>
      </div>
    );
  }

  const weatherIconName = WEATHER_ICONS[timeWeather.globalWeather.condition] || 'cloud-partial';
  const seasonIconName = currentSeason ? SEASON_ICONS[currentSeason] : 'flower';
  const todIconName = currentTimeOfDay ? getTimeOfDayIcon(currentTimeOfDay) : 'sun';

  const handleQuickAdvance = (hours: number) => {
    advanceTimeBy(hours);
  };

  const handleToggleRadar = () => {
    if (!campaign?.weatherSimulation) return;

    const newEnabled = !simConfig?.enabled;
    updateCampaignData({
      weatherSimulation: {
        ...campaign.weatherSimulation,
        config: {
          ...campaign.weatherSimulation.config,
          enabled: newEnabled
        }
      }
    });

    if (newEnabled && !weatherSim.isRunning) {
      // Start the simulation
      const hexes = Object.entries(campaign.hexes).map(([key, hex]) => ({
        key,
        terrain: hex.terrain,
        elevation: campaign.terrainTypes.find(t => t.name === hex.terrain)?.elevation ?? 1,
        isCoast: hex.terrain === 'Coast',
        hasRiver: !!(hex.connections?.rivers?.length)
      }));
      weatherSim.startSimulation(
        { width: campaign.gridWidth, height: campaign.gridHeight, hexes },
        campaign.weatherSimulation.seed || String(Date.now()),
        { ...campaign.weatherSimulation.config, enabled: true }
      );
    } else if (!newEnabled && weatherSim.isRunning) {
      weatherSim.stopSimulation();
    }
  };

  return (
    <div className="time-weather-bar">
      {/* Weather Section */}
      <div
        className="time-weather-bar__section time-weather-bar__weather"
        onClick={onOpenWeatherSettings}
        title="Click to change weather"
      >
        <span className="time-weather-bar__icon"><Icon name={weatherIconName} size={16} /></span>
        <span className="time-weather-bar__text">{weatherSummary}</span>
      </div>

      {/* Simulation status + active events */}
      {simConfig?.enabled && (
        <>
          <div className="time-weather-bar__divider" />
          <div className={`weather-sim-status ${weatherSim.isRunning ? 'running' : ''}`}>
            <Icon name="cloud-storm" size={12} />
            <span>{weatherSim.isRunning ? 'Sim' : 'Paused'}</span>
          </div>
          {weatherSim.activeEvents.length > 0 && (
            <div className="weather-sim-events">
              {weatherSim.activeEvents.map(event => (
                <WeatherEventBadge
                  key={event.id}
                  event={event}
                  onCancel={(id) => weatherSim.cancelEvent(id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="time-weather-bar__divider" />

      {/* Date Section */}
      <div
        className="time-weather-bar__section time-weather-bar__date"
        onClick={onOpenTimeControls}
        title="Click to set time"
      >
        <span className="time-weather-bar__icon"><Icon name="calendar" size={16} /></span>
        <span className="time-weather-bar__text">{formattedDate}</span>
      </div>

      <div className="time-weather-bar__divider" />

      {/* Time Section */}
      <div
        className="time-weather-bar__section time-weather-bar__time"
        onClick={onOpenTimeControls}
        title="Click to set time"
      >
        <span className="time-weather-bar__icon"><Icon name={todIconName} size={16} /></span>
        <span className="time-weather-bar__text">{formattedTime}</span>
      </div>

      <div className="time-weather-bar__divider" />

      {/* Season */}
      <div className="time-weather-bar__section time-weather-bar__season">
        <span className="time-weather-bar__icon"><Icon name={seasonIconName} size={16} /></span>
        <span className="time-weather-bar__text time-weather-bar__text--capitalize">
          {currentSeason}
        </span>
      </div>

      <div className="time-weather-bar__divider" />

      {/* Quick Actions */}
      <div className="time-weather-bar__actions">
        <WeatherRadarToggle
          enabled={!!simConfig?.enabled}
          isRunning={weatherSim.isRunning}
          onToggle={handleToggleRadar}
        />
        <button
          className="btn btn-icon btn-small"
          onClick={() => handleQuickAdvance(1)}
          title="Advance 1 hour"
        >
          +1h
        </button>
        <button
          className="btn btn-icon btn-small"
          onClick={() => handleQuickAdvance(6)}
          title="Advance 6 hours"
        >
          +6h
        </button>
        <button
          className="btn btn-icon btn-small"
          onClick={() => handleQuickAdvance(24)}
          title="Advance 1 day"
        >
          +1d
        </button>
        <button
          className="btn btn-icon btn-small"
          onClick={() => generateNewWeather()}
          title="Generate new weather"
          aria-label="Generate new weather"
        >
          <Icon name="dice" size={14} />
        </button>
        <button
          className="btn btn-icon btn-small"
          onClick={onOpenTimeControls}
          title="Time controls"
          aria-label="Time controls"
        >
          <Icon name="settings" size={14} />
        </button>
      </div>
    </div>
  );
}

export default TimeWeatherBar;
