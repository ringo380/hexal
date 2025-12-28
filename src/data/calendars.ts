// Fantasy Calendar Presets

import { CalendarSystem, CalendarPreset } from '../types/Weather';

export const CALENDAR_PRESETS: Record<CalendarPreset, CalendarSystem> = {
  'simple': {
    preset: 'simple',
    name: 'Simple Calendar',
    months: [
      { name: 'Month 1', days: 30, season: 'winter' },
      { name: 'Month 2', days: 30, season: 'winter' },
      { name: 'Month 3', days: 30, season: 'winter' },
      { name: 'Month 4', days: 30, season: 'spring' },
      { name: 'Month 5', days: 30, season: 'spring' },
      { name: 'Month 6', days: 30, season: 'spring' },
      { name: 'Month 7', days: 30, season: 'summer' },
      { name: 'Month 8', days: 30, season: 'summer' },
      { name: 'Month 9', days: 30, season: 'summer' },
      { name: 'Month 10', days: 30, season: 'autumn' },
      { name: 'Month 11', days: 30, season: 'autumn' },
      { name: 'Month 12', days: 30, season: 'autumn' }
    ],
    daysPerWeek: 7,
    weekDayNames: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    hoursPerDay: 24
  },

  'greyhawk': {
    preset: 'greyhawk',
    name: 'Greyhawk Calendar',
    months: [
      // Winter/Spring festivals and months
      { name: 'Needfest', days: 7, season: 'winter' },
      { name: 'Fireseek', days: 28, season: 'winter' },
      { name: 'Readying', days: 28, season: 'spring' },
      { name: 'Coldeven', days: 28, season: 'spring' },
      { name: 'Growfest', days: 7, season: 'spring' },
      { name: 'Planting', days: 28, season: 'spring' },
      // Summer months
      { name: 'Flocktime', days: 28, season: 'summer' },
      { name: 'Wealsun', days: 28, season: 'summer' },
      { name: 'Richfest', days: 7, season: 'summer' },
      { name: 'Reaping', days: 28, season: 'summer' },
      // Autumn months
      { name: 'Goodmonth', days: 28, season: 'autumn' },
      { name: 'Harvester', days: 28, season: 'autumn' },
      { name: 'Brewfest', days: 7, season: 'autumn' },
      { name: 'Patchwall', days: 28, season: 'autumn' },
      // Winter months
      { name: "Ready'reat", days: 28, season: 'winter' },
      { name: 'Sunsebb', days: 28, season: 'winter' }
    ],
    daysPerWeek: 7,
    weekDayNames: ['Starday', 'Sunday', 'Moonday', 'Godsday', 'Waterday', 'Earthday', 'Freeday'],
    hoursPerDay: 24
  },

  'forgotten-realms': {
    preset: 'forgotten-realms',
    name: 'Harptos Calendar (Forgotten Realms)',
    months: [
      // Winter
      { name: 'Hammer', days: 30, season: 'winter' },
      { name: 'Midwinter', days: 1, season: 'winter' },  // Festival
      { name: 'Alturiak', days: 30, season: 'winter' },
      // Spring
      { name: 'Ches', days: 30, season: 'spring' },
      { name: 'Tarsakh', days: 30, season: 'spring' },
      { name: 'Greengrass', days: 1, season: 'spring' },  // Festival
      { name: 'Mirtul', days: 30, season: 'spring' },
      // Summer
      { name: 'Kythorn', days: 30, season: 'summer' },
      { name: 'Flamerule', days: 30, season: 'summer' },
      { name: 'Midsummer', days: 1, season: 'summer' },  // Festival
      { name: 'Eleasis', days: 30, season: 'summer' },
      // Autumn
      { name: 'Eleint', days: 30, season: 'autumn' },
      { name: 'Highharvestide', days: 1, season: 'autumn' },  // Festival
      { name: 'Marpenoth', days: 30, season: 'autumn' },
      { name: 'Uktar', days: 30, season: 'autumn' },
      { name: 'Feast of the Moon', days: 1, season: 'autumn' },  // Festival
      { name: 'Nightal', days: 30, season: 'winter' }
    ],
    daysPerWeek: 10,
    weekDayNames: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'],
    hoursPerDay: 24
  },

  'eberron': {
    preset: 'eberron',
    name: 'Eberron Calendar',
    months: [
      { name: 'Zarantyr', days: 28, season: 'winter' },
      { name: 'Olarune', days: 28, season: 'winter' },
      { name: 'Therendor', days: 28, season: 'spring' },
      { name: 'Eyre', days: 28, season: 'spring' },
      { name: 'Dravago', days: 28, season: 'spring' },
      { name: 'Nymm', days: 28, season: 'summer' },
      { name: 'Lharvion', days: 28, season: 'summer' },
      { name: 'Barrakas', days: 28, season: 'summer' },
      { name: 'Rhaan', days: 28, season: 'autumn' },
      { name: 'Sypheros', days: 28, season: 'autumn' },
      { name: 'Aryth', days: 28, season: 'autumn' },
      { name: 'Vult', days: 28, season: 'winter' }
    ],
    daysPerWeek: 7,
    weekDayNames: ['Sul', 'Mol', 'Zol', 'Wir', 'Zor', 'Far', 'Sar'],
    hoursPerDay: 24
  },

  'custom': {
    preset: 'custom',
    name: 'Custom Calendar',
    months: [
      { name: 'Month 1', days: 30, season: 'spring' },
      { name: 'Month 2', days: 30, season: 'spring' },
      { name: 'Month 3', days: 30, season: 'spring' },
      { name: 'Month 4', days: 30, season: 'summer' },
      { name: 'Month 5', days: 30, season: 'summer' },
      { name: 'Month 6', days: 30, season: 'summer' },
      { name: 'Month 7', days: 30, season: 'autumn' },
      { name: 'Month 8', days: 30, season: 'autumn' },
      { name: 'Month 9', days: 30, season: 'autumn' },
      { name: 'Month 10', days: 30, season: 'winter' },
      { name: 'Month 11', days: 30, season: 'winter' },
      { name: 'Month 12', days: 30, season: 'winter' }
    ],
    daysPerWeek: 7,
    weekDayNames: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    hoursPerDay: 24
  }
};

// Helper to get total days in a year for a calendar
export function getTotalDaysInYear(calendar: CalendarSystem): number {
  return calendar.months.reduce((sum, month) => sum + month.days, 0);
}

// Helper to get the month index and day from day-of-year
export function getMonthFromDayOfYear(calendar: CalendarSystem, dayOfYear: number): { monthIndex: number; dayOfMonth: number } {
  let remainingDays = dayOfYear;
  for (let i = 0; i < calendar.months.length; i++) {
    if (remainingDays <= calendar.months[i].days) {
      return { monthIndex: i, dayOfMonth: remainingDays };
    }
    remainingDays -= calendar.months[i].days;
  }
  // Fallback to last day of year
  const lastMonth = calendar.months.length - 1;
  return { monthIndex: lastMonth, dayOfMonth: calendar.months[lastMonth].days };
}

// Helper to get day of year from month and day
export function getDayOfYear(calendar: CalendarSystem, monthIndex: number, dayOfMonth: number): number {
  let dayOfYear = dayOfMonth;
  for (let i = 0; i < monthIndex && i < calendar.months.length; i++) {
    dayOfYear += calendar.months[i].days;
  }
  return dayOfYear;
}

// Get year suffix/prefix for display (e.g., "591 CY" for Greyhawk)
export function getYearDisplay(calendar: CalendarSystem, year: number): string {
  switch (calendar.preset) {
    case 'greyhawk':
      return `${year} CY`;  // Common Year
    case 'forgotten-realms':
      return `${year} DR`;  // Dale Reckoning
    case 'eberron':
      return `${year} YK`;  // Year of the Kingdom
    default:
      return `Year ${year}`;
  }
}

// Get a default starting year appropriate for the calendar
export function getDefaultStartYear(preset: CalendarPreset): number {
  switch (preset) {
    case 'greyhawk':
      return 591;  // Classic Greyhawk era
    case 'forgotten-realms':
      return 1492; // Time of Troubles era / 5th Edition
    case 'eberron':
      return 998;  // Post-Last War era
    default:
      return 1;
  }
}
