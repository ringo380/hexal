// Badge showing an active weather event in the TimeWeatherBar

import type { WeatherEvent } from '../../types/Weather';
import { WEATHER_EVENT_DEFS } from '../../services/weather/WeatherEvents';
import Icon from '../icons/Icon';
import type { IconName } from '../icons/Icon';

const EVENT_ICONS: Record<string, IconName> = {
  hurricane: 'cloud-storm',
  blizzard: 'snowflake',
  'heat-wave': 'thermometer-hot',
  monsoon: 'cloud-rain',
  tornado: 'wind'
};

const EVENT_COLORS: Record<string, string> = {
  hurricane: '#e91e63',
  blizzard: '#4a9eff',
  'heat-wave': '#ff5722',
  monsoon: '#00bcd4',
  tornado: '#9c27b0'
};

interface WeatherEventBadgeProps {
  event: WeatherEvent;
  onCancel?: (eventId: string) => void;
}

function WeatherEventBadge({ event, onCancel }: WeatherEventBadgeProps) {
  const def = WEATHER_EVENT_DEFS[event.type];
  const color = EVENT_COLORS[event.type] || '#666';
  const icon = EVENT_ICONS[event.type] || 'cloud-storm';

  return (
    <span
      className="weather-event-badge"
      style={{ borderColor: color }}
      title={`${def.label}: ${def.description}`}
    >
      <Icon name={icon} size={12} />
      <span className="weather-event-badge-label">{def.label}</span>
      {onCancel && (
        <button
          className="weather-event-badge-cancel"
          onClick={() => onCancel(event.id)}
          title="Cancel event"
          aria-label={`Cancel ${def.label} event`}
        >
          ×
        </button>
      )}
    </span>
  );
}

export default WeatherEventBadge;
