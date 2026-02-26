// Toolbar button to toggle weather radar overlay on/off

import Icon from '../icons/Icon';

interface WeatherRadarToggleProps {
  enabled: boolean;
  isRunning: boolean;
  onToggle: () => void;
}

function WeatherRadarToggle({ enabled, isRunning, onToggle }: WeatherRadarToggleProps) {
  return (
    <button
      className={`btn-icon-small weather-radar-toggle ${enabled ? 'active' : ''}`}
      onClick={onToggle}
      title={enabled ? 'Disable weather radar' : 'Enable weather radar'}
      aria-label={enabled ? 'Disable weather radar overlay' : 'Enable weather radar overlay'}
    >
      <Icon name="cloud-storm" size={14} />
      {isRunning && <span className="weather-radar-indicator" />}
    </button>
  );
}

export default WeatherRadarToggle;
