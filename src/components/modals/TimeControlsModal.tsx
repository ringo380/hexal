// TimeControlsModal - Modal for time/calendar controls
import { useState } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import { CALENDAR_PRESETS, getTotalDaysInYear } from '../../data/calendars';
import { getTimeOfDayLabel, getTimeOfDayIcon } from '../../services/time';
import { CalendarPreset, SEASON_ICONS } from '../../types/Weather';

interface TimeControlsModalProps {
  onClose: () => void;
}

function TimeControlsModal({ onClose }: TimeControlsModalProps) {
  const {
    timeWeather,
    currentSeason,
    currentTimeOfDay,
    formattedTime,
    formattedDate,
    setCalendar,
    setTime,
    advanceTimeBy,
    initTimeWeather
  } = useCampaign();

  // Custom advance inputs
  const [customHours, setCustomHours] = useState<number>(1);
  const [customDays, setCustomDays] = useState<number>(0);

  // If no timeWeather, show setup
  if (!timeWeather) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal time-controls-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Time & Weather Setup</h2>
            <button className="btn btn-icon" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <p>Time and weather tracking is not enabled for this campaign.</p>
            <p>Enable it to track in-game time, seasons, and weather conditions.</p>
            <button className="btn btn-primary" onClick={() => { initTimeWeather(); }}>
              Enable Time & Weather Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calendar = timeWeather.calendar;
  const time = timeWeather.currentTime;

  const handleCalendarChange = (preset: CalendarPreset) => {
    if (preset === 'custom') {
      // For custom, keep current calendar but change preset type
      setCalendar({ ...calendar, preset: 'custom' });
    } else {
      setCalendar(CALENDAR_PRESETS[preset]);
    }
  };

  const handleYearChange = (year: number) => {
    if (year >= 1) {
      setTime({ ...time, year });
    }
  };

  const handleMonthChange = (month: number) => {
    const newDay = Math.min(time.day, calendar.months[month]?.days || 30);
    setTime({ ...time, month, day: newDay });
  };

  const handleDayChange = (day: number) => {
    const maxDays = calendar.months[time.month]?.days || 30;
    if (day >= 1 && day <= maxDays) {
      setTime({ ...time, day });
    }
  };

  const handleHourChange = (hour: number) => {
    if (hour >= 0 && hour < calendar.hoursPerDay) {
      setTime({ ...time, hour });
    }
  };

  const handleMinuteChange = (minute: number) => {
    if (minute >= 0 && minute < 60) {
      setTime({ ...time, minute });
    }
  };

  const handleQuickAdvance = (hours: number) => {
    advanceTimeBy(hours);
  };

  const handleCustomAdvance = () => {
    const totalHours = customHours + (customDays * calendar.hoursPerDay);
    if (totalHours > 0) {
      advanceTimeBy(totalHours);
    }
  };

  const todIcon = currentTimeOfDay ? getTimeOfDayIcon(currentTimeOfDay) : '☀️';
  const todLabel = currentTimeOfDay ? getTimeOfDayLabel(currentTimeOfDay) : 'Day';
  const seasonIcon = currentSeason ? SEASON_ICONS[currentSeason] : '🌸';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal time-controls-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⏰ Time Controls</h2>
          <button className="btn btn-icon" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Calendar Selection */}
          <div className="form-group">
            <label>Calendar System</label>
            <select
              value={calendar.preset}
              onChange={(e) => handleCalendarChange(e.target.value as CalendarPreset)}
            >
              <option value="simple">Simple Calendar (12 × 30-day months)</option>
              <option value="greyhawk">Greyhawk Calendar</option>
              <option value="forgotten-realms">Harptos Calendar (Forgotten Realms)</option>
              <option value="eberron">Eberron Calendar</option>
              <option value="custom">Custom Calendar</option>
            </select>
          </div>

          {/* Current Time Display */}
          <div className="time-controls-current">
            <div className="time-controls-display">
              <span className="time-controls-icon">{todIcon}</span>
              <span className="time-controls-time">{formattedTime}</span>
              <span className="time-controls-tod">({todLabel})</span>
            </div>
            <div className="time-controls-display">
              <span className="time-controls-icon">📅</span>
              <span className="time-controls-date">{formattedDate}</span>
            </div>
            <div className="time-controls-display">
              <span className="time-controls-icon">{seasonIcon}</span>
              <span className="time-controls-season">{currentSeason}</span>
            </div>
          </div>

          {/* Date/Time Inputs */}
          <div className="time-controls-inputs">
            <div className="form-row">
              <div className="form-group">
                <label>Year</label>
                <input
                  type="number"
                  min={1}
                  value={time.year}
                  onChange={(e) => handleYearChange(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="form-group">
                <label>Month</label>
                <select
                  value={time.month}
                  onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                >
                  {calendar.months.map((month, index) => (
                    <option key={index} value={index}>
                      {month.name} ({month.days} days)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Day</label>
                <input
                  type="number"
                  min={1}
                  max={calendar.months[time.month]?.days || 30}
                  value={time.day}
                  onChange={(e) => handleDayChange(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="form-group">
                <label>Hour</label>
                <input
                  type="number"
                  min={0}
                  max={calendar.hoursPerDay - 1}
                  value={time.hour}
                  onChange={(e) => handleHourChange(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Minute</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={time.minute}
                  onChange={(e) => handleMinuteChange(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Quick Advance Buttons */}
          <div className="time-controls-quick">
            <label>Quick Advance</label>
            <div className="time-controls-buttons">
              <button className="btn btn-small" onClick={() => handleQuickAdvance(1)}>
                +1 Hour
              </button>
              <button className="btn btn-small" onClick={() => handleQuickAdvance(4)}>
                +4 Hours
              </button>
              <button className="btn btn-small" onClick={() => handleQuickAdvance(8)}>
                +8 Hours
              </button>
              <button className="btn btn-small" onClick={() => handleQuickAdvance(calendar.hoursPerDay)}>
                +1 Day
              </button>
              <button className="btn btn-small" onClick={() => handleQuickAdvance(calendar.hoursPerDay * 7)}>
                +1 Week
              </button>
            </div>
          </div>

          {/* Custom Advance */}
          <div className="time-controls-custom">
            <label>Custom Advance</label>
            <div className="time-controls-custom-inputs">
              <div className="form-group">
                <input
                  type="number"
                  min={0}
                  value={customDays}
                  onChange={(e) => setCustomDays(parseInt(e.target.value) || 0)}
                />
                <span>days</span>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  min={0}
                  value={customHours}
                  onChange={(e) => setCustomHours(parseInt(e.target.value) || 0)}
                />
                <span>hours</span>
              </div>
              <button className="btn btn-primary" onClick={handleCustomAdvance}>
                Advance
              </button>
            </div>
          </div>

          {/* Calendar Info */}
          <div className="time-controls-info">
            <h4>Calendar: {calendar.name}</h4>
            <p>
              {calendar.months.length} months, {getTotalDaysInYear(calendar)} days per year,
              {calendar.daysPerWeek} days per week, {calendar.hoursPerDay} hours per day
            </p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default TimeControlsModal;
