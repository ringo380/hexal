// TimeWeatherBar - Compact toolbar display for time and weather
import { useCampaign } from '../stores/CampaignContext';
import {
  WEATHER_ICONS,
  SEASON_ICONS
} from '../types/Weather';
import { getTimeOfDayIcon } from '../services/time';

interface TimeWeatherBarProps {
  onOpenTimeControls: () => void;
  onOpenWeatherSettings: () => void;
}

function TimeWeatherBar({ onOpenTimeControls, onOpenWeatherSettings }: TimeWeatherBarProps) {
  const {
    timeWeather,
    currentSeason,
    currentTimeOfDay,
    formattedTime,
    formattedDate,
    weatherSummary,
    advanceTimeBy,
    generateNewWeather,
    initTimeWeather
  } = useCampaign();

  // If no time/weather initialized, show setup button
  if (!timeWeather) {
    return (
      <div className="time-weather-bar time-weather-bar--setup">
        <button
          className="btn btn-small btn-primary"
          onClick={initTimeWeather}
          title="Enable time & weather tracking"
        >
          ⏰ Enable Time & Weather
        </button>
      </div>
    );
  }

  const weatherIcon = WEATHER_ICONS[timeWeather.globalWeather.condition] || '🌤️';
  const seasonIcon = currentSeason ? SEASON_ICONS[currentSeason] : '🌸';
  const todIcon = currentTimeOfDay ? getTimeOfDayIcon(currentTimeOfDay) : '☀️';

  const handleQuickAdvance = (hours: number) => {
    advanceTimeBy(hours);
  };

  return (
    <div className="time-weather-bar">
      {/* Weather Section */}
      <div
        className="time-weather-bar__section time-weather-bar__weather"
        onClick={onOpenWeatherSettings}
        title="Click to change weather"
      >
        <span className="time-weather-bar__icon">{weatherIcon}</span>
        <span className="time-weather-bar__text">{weatherSummary}</span>
      </div>

      <div className="time-weather-bar__divider" />

      {/* Date Section */}
      <div
        className="time-weather-bar__section time-weather-bar__date"
        onClick={onOpenTimeControls}
        title="Click to set time"
      >
        <span className="time-weather-bar__icon">📅</span>
        <span className="time-weather-bar__text">{formattedDate}</span>
      </div>

      <div className="time-weather-bar__divider" />

      {/* Time Section */}
      <div
        className="time-weather-bar__section time-weather-bar__time"
        onClick={onOpenTimeControls}
        title="Click to set time"
      >
        <span className="time-weather-bar__icon">{todIcon}</span>
        <span className="time-weather-bar__text">{formattedTime}</span>
      </div>

      <div className="time-weather-bar__divider" />

      {/* Season */}
      <div className="time-weather-bar__section time-weather-bar__season">
        <span className="time-weather-bar__icon">{seasonIcon}</span>
        <span className="time-weather-bar__text time-weather-bar__text--capitalize">
          {currentSeason}
        </span>
      </div>

      <div className="time-weather-bar__divider" />

      {/* Quick Actions */}
      <div className="time-weather-bar__actions">
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
        >
          🎲
        </button>
        <button
          className="btn btn-icon btn-small"
          onClick={onOpenTimeControls}
          title="Time controls"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}

export default TimeWeatherBar;
