import { describe, it, expect } from 'vitest';
import {
  getEntriesForSession,
  getEntriesForHex,
  filterEntriesByTags,
  getTimeline,
  getSortedSessions,
  getNextSessionNumber,
  exportSessionMarkdown
} from '../services/sessionLog';
import { createSession } from '../types/Campaign';
import type { Session, SessionLogEntry } from '../types/Campaign';
import type { CurrentTime } from '../types/Weather';
import { CALENDAR_PRESETS } from '../data/calendars';

const calendar = CALENDAR_PRESETS['simple'];

function makeTime(year: number, month: number, day: number, hour: number, minute: number): CurrentTime {
  return { year, month, day, hour, minute };
}

function makeEntry(overrides: Partial<SessionLogEntry> & { sessionId: string; inGameTime: CurrentTime }): SessionLogEntry {
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    hexKeys: [],
    tags: [],
    isVisibleToPlayers: true,
    ...overrides
  };
}

describe('getEntriesForSession', () => {
  it('filters and sorts entries by in-game time', () => {
    const entries: SessionLogEntry[] = [
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 14, 0), title: 'Afternoon' }),
      makeEntry({ sessionId: 's2', inGameTime: makeTime(1, 0, 1, 10, 0), title: 'Other session' }),
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 8, 0), title: 'Morning' }),
    ];
    const result = getEntriesForSession(entries, 's1');
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Morning');
    expect(result[1].title).toBe('Afternoon');
  });

  it('returns empty for unknown session', () => {
    const entries: SessionLogEntry[] = [
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 8, 0) }),
    ];
    expect(getEntriesForSession(entries, 'unknown')).toEqual([]);
  });
});

describe('getEntriesForHex', () => {
  it('finds entries by hex key', () => {
    const entries: SessionLogEntry[] = [
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 8, 0), hexKeys: ['0,0', '1,0'] }),
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 10, 0), hexKeys: ['2,0'] }),
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 12, 0), hexKeys: ['0,0'] }),
    ];
    const result = getEntriesForHex(entries, '0,0');
    expect(result).toHaveLength(2);
  });

  it('returns empty when no entries reference the hex', () => {
    const entries: SessionLogEntry[] = [
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 8, 0), hexKeys: ['1,1'] }),
    ];
    expect(getEntriesForHex(entries, '5,5')).toEqual([]);
  });
});

describe('filterEntriesByTags', () => {
  it('filters by tags', () => {
    const entries: SessionLogEntry[] = [
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 8, 0), tags: ['combat'] }),
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 10, 0), tags: ['social'] }),
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 12, 0), tags: ['combat', 'quest'] }),
    ];
    const result = filterEntriesByTags(entries, ['combat']);
    expect(result).toHaveLength(2);
  });

  it('returns all when no tags specified', () => {
    const entries: SessionLogEntry[] = [
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 8, 0), tags: ['combat'] }),
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 10, 0), tags: ['social'] }),
    ];
    expect(filterEntriesByTags(entries, [])).toHaveLength(2);
  });
});

describe('getTimeline', () => {
  it('sorts all entries chronologically', () => {
    const entries: SessionLogEntry[] = [
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 2, 8, 0), title: 'Day 2' }),
      makeEntry({ sessionId: 's1', inGameTime: makeTime(1, 0, 1, 8, 0), title: 'Day 1' }),
      makeEntry({ sessionId: 's2', inGameTime: makeTime(1, 0, 1, 14, 0), title: 'Day 1 afternoon' }),
    ];
    const result = getTimeline(entries);
    expect(result[0].title).toBe('Day 1');
    expect(result[1].title).toBe('Day 1 afternoon');
    expect(result[2].title).toBe('Day 2');
  });
});

describe('getSortedSessions', () => {
  it('sorts by number', () => {
    const sessions: Session[] = [
      { ...createSession(3), title: 'Third' },
      { ...createSession(1), title: 'First' },
      { ...createSession(2), title: 'Second' },
    ];
    const result = getSortedSessions(sessions);
    expect(result[0].title).toBe('First');
    expect(result[1].title).toBe('Second');
    expect(result[2].title).toBe('Third');
  });
});

describe('getNextSessionNumber', () => {
  it('returns max+1', () => {
    const sessions = [createSession(1), createSession(3), createSession(2)];
    expect(getNextSessionNumber(sessions)).toBe(4);
  });

  it('returns 1 for empty', () => {
    expect(getNextSessionNumber([])).toBe(1);
  });
});

describe('exportSessionMarkdown', () => {
  it('generates correct markdown', () => {
    const session = createSession(1, 'The Beginning');
    session.realWorldDate = '2026-01-15';
    session.inGameTimeStart = makeTime(1, 0, 1, 8, 0);
    session.hexesVisited = ['0,0', '1,0'];

    const entries: SessionLogEntry[] = [
      makeEntry({
        sessionId: session.id,
        inGameTime: makeTime(1, 0, 1, 8, 0),
        title: 'Set out from town',
        description: 'The party headed east.',
        tags: ['travel'],
        hexKeys: ['0,0']
      }),
    ];

    const md = exportSessionMarkdown(session, entries, calendar);

    expect(md).toContain('# Session 1: The Beginning');
    expect(md).toContain('**Date**: 2026-01-15');
    expect(md).toContain('**Hexes Visited**: 0,0, 1,0');
    expect(md).toContain('### Set out from town');
    expect(md).toContain('**Tags**: Travel');
    expect(md).toContain('The party headed east.');
  });
});
