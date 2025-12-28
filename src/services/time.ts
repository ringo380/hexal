// Time System Utilities

import {
  CurrentTime,
  CalendarSystem,
  Season,
  TimeOfDay
} from '../types/Weather';
import { getYearDisplay, getTotalDaysInYear } from '../data/calendars';

/**
 * Get the time of day based on hour
 */
export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dusk';
  if (hour >= 20 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 1) return 'night';
  return 'midnight';
}

/**
 * Get icon for time of day
 */
export function getTimeOfDayIcon(tod: TimeOfDay): string {
  switch (tod) {
    case 'dawn': return '🌅';
    case 'morning': return '☀️';
    case 'midday': return '☀️';
    case 'afternoon': return '🌤️';
    case 'dusk': return '🌆';
    case 'evening': return '🌙';
    case 'night': return '🌙';
    case 'midnight': return '🌑';
  }
}

/**
 * Get label for time of day
 */
export function getTimeOfDayLabel(tod: TimeOfDay): string {
  switch (tod) {
    case 'dawn': return 'Dawn';
    case 'morning': return 'Morning';
    case 'midday': return 'Midday';
    case 'afternoon': return 'Afternoon';
    case 'dusk': return 'Dusk';
    case 'evening': return 'Evening';
    case 'night': return 'Night';
    case 'midnight': return 'Midnight';
  }
}

/**
 * Get the current season based on month
 */
export function getCurrentSeason(calendar: CalendarSystem, monthIndex: number): Season {
  if (monthIndex < 0 || monthIndex >= calendar.months.length) {
    return 'spring'; // Default fallback
  }
  return calendar.months[monthIndex].season;
}

/**
 * Format time as 12-hour clock (e.g., "2:30 PM")
 */
export function formatTime12(time: CurrentTime): string {
  const hour12 = time.hour % 12 || 12;
  const ampm = time.hour < 12 ? 'AM' : 'PM';
  const minutes = time.minute.toString().padStart(2, '0');
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Format time as 24-hour clock (e.g., "14:30")
 */
export function formatTime24(time: CurrentTime): string {
  const hours = time.hour.toString().padStart(2, '0');
  const minutes = time.minute.toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format the full date (e.g., "23 Flocktime, 591 CY")
 */
export function formatDate(calendar: CalendarSystem, time: CurrentTime): string {
  const monthName = calendar.months[time.month]?.name || `Month ${time.month + 1}`;
  const yearDisplay = getYearDisplay(calendar, time.year);
  return `${time.day} ${monthName}, ${yearDisplay}`;
}

/**
 * Format short date (e.g., "Day 23, Flocktime")
 */
export function formatShortDate(calendar: CalendarSystem, time: CurrentTime): string {
  const monthName = calendar.months[time.month]?.name || `Month ${time.month + 1}`;
  return `Day ${time.day}, ${monthName}`;
}

/**
 * Get the current weekday name
 */
export function getWeekdayName(calendar: CalendarSystem, time: CurrentTime): string {
  // Calculate total days elapsed
  const dayOfYear = getDayOfYear(calendar, time.month, time.day);
  const dayIndex = (dayOfYear - 1) % calendar.daysPerWeek;
  return calendar.weekDayNames[dayIndex] || `Day ${dayIndex + 1}`;
}

/**
 * Get day of year (1-indexed)
 */
export function getDayOfYear(calendar: CalendarSystem, monthIndex: number, dayOfMonth: number): number {
  let dayOfYear = dayOfMonth;
  for (let i = 0; i < monthIndex && i < calendar.months.length; i++) {
    dayOfYear += calendar.months[i].days;
  }
  return dayOfYear;
}

/**
 * Advance time by hours and minutes
 * Returns a new CurrentTime object
 */
export function advanceTime(
  calendar: CalendarSystem,
  time: CurrentTime,
  hours: number = 0,
  minutes: number = 0
): CurrentTime {
  let newTime = { ...time };

  // Add minutes
  newTime.minute += minutes;
  while (newTime.minute >= 60) {
    newTime.minute -= 60;
    hours++;
  }
  while (newTime.minute < 0) {
    newTime.minute += 60;
    hours--;
  }

  // Add hours
  newTime.hour += hours;
  while (newTime.hour >= calendar.hoursPerDay) {
    newTime.hour -= calendar.hoursPerDay;
    newTime = advanceDays(calendar, newTime, 1);
  }
  while (newTime.hour < 0) {
    newTime.hour += calendar.hoursPerDay;
    newTime = advanceDays(calendar, newTime, -1);
  }

  return newTime;
}

/**
 * Advance time by days
 */
export function advanceDays(
  calendar: CalendarSystem,
  time: CurrentTime,
  days: number
): CurrentTime {
  let newTime = { ...time };

  newTime.day += days;

  // Handle positive overflow
  while (newTime.day > (calendar.months[newTime.month]?.days || 30)) {
    const daysInMonth = calendar.months[newTime.month]?.days || 30;
    newTime.day -= daysInMonth;
    newTime.month++;

    if (newTime.month >= calendar.months.length) {
      newTime.month = 0;
      newTime.year++;
    }
  }

  // Handle negative overflow
  while (newTime.day < 1) {
    newTime.month--;
    if (newTime.month < 0) {
      newTime.month = calendar.months.length - 1;
      newTime.year--;
    }
    const daysInMonth = calendar.months[newTime.month]?.days || 30;
    newTime.day += daysInMonth;
  }

  return newTime;
}

/**
 * Compare two times
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareTime(a: CurrentTime, b: CurrentTime): number {
  if (a.year !== b.year) return a.year < b.year ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.day !== b.day) return a.day < b.day ? -1 : 1;
  if (a.hour !== b.hour) return a.hour < b.hour ? -1 : 1;
  if (a.minute !== b.minute) return a.minute < b.minute ? -1 : 1;
  return 0;
}

/**
 * Calculate hours between two times (positive if b is later)
 */
export function hoursBetween(
  calendar: CalendarSystem,
  a: CurrentTime,
  b: CurrentTime
): number {
  const totalDaysInYear = getTotalDaysInYear(calendar);

  // Convert both to total hours from year 0
  const toTotalHours = (t: CurrentTime): number => {
    const dayOfYear = getDayOfYear(calendar, t.month, t.day);
    const totalDays = (t.year * totalDaysInYear) + dayOfYear - 1;
    return totalDays * calendar.hoursPerDay + t.hour + (t.minute / 60);
  };

  return toTotalHours(b) - toTotalHours(a);
}

/**
 * Get display summary for current time/date
 */
export function getTimeSummary(calendar: CalendarSystem, time: CurrentTime): string {
  const timeStr = formatTime12(time);
  const dateStr = formatDate(calendar, time);
  const tod = getTimeOfDay(time.hour);
  const todLabel = getTimeOfDayLabel(tod);
  return `${timeStr} (${todLabel}) - ${dateStr}`;
}

/**
 * Parse a time string (HH:MM) into hour and minute
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

/**
 * Validate that a time is within valid bounds for the calendar
 */
export function isValidTime(calendar: CalendarSystem, time: CurrentTime): boolean {
  if (time.year < 1) return false;
  if (time.month < 0 || time.month >= calendar.months.length) return false;
  if (time.day < 1 || time.day > (calendar.months[time.month]?.days || 30)) return false;
  if (time.hour < 0 || time.hour >= calendar.hoursPerDay) return false;
  if (time.minute < 0 || time.minute >= 60) return false;
  return true;
}

/**
 * Clamp time to valid bounds
 */
export function clampTime(calendar: CalendarSystem, time: CurrentTime): CurrentTime {
  return {
    year: Math.max(1, time.year),
    month: Math.max(0, Math.min(calendar.months.length - 1, time.month)),
    day: Math.max(1, Math.min(calendar.months[time.month]?.days || 30, time.day)),
    hour: Math.max(0, Math.min(calendar.hoursPerDay - 1, time.hour)),
    minute: Math.max(0, Math.min(59, time.minute))
  };
}
