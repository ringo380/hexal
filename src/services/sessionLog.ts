// Session Log Service - Pure utility functions for session log data

import type { Session, SessionLogEntry, SessionLogTag, Campaign } from '../types/Campaign';
import type { CalendarSystem } from '../types/Weather';
import { compareTime, formatDate, formatTime12 } from './time';
import { SESSION_TAG_INFO } from '../types/Campaign';

/** Get all entries for a specific session, sorted by in-game time */
export function getEntriesForSession(log: SessionLogEntry[], sessionId: string): SessionLogEntry[] {
  return log
    .filter(e => e.sessionId === sessionId)
    .sort((a, b) => compareTime(a.inGameTime, b.inGameTime));
}

/** Get all entries that reference a specific hex key */
export function getEntriesForHex(log: SessionLogEntry[], hexKey: string): SessionLogEntry[] {
  return log.filter(e => e.hexKeys.includes(hexKey));
}

/** Filter entries by tags (returns all if tags array is empty) */
export function filterEntriesByTags(log: SessionLogEntry[], tags: SessionLogTag[]): SessionLogEntry[] {
  if (tags.length === 0) return log;
  return log.filter(e => e.tags.some(t => tags.includes(t)));
}

/** Get all entries sorted chronologically by in-game time */
export function getTimeline(log: SessionLogEntry[]): SessionLogEntry[] {
  return [...log].sort((a, b) => compareTime(a.inGameTime, b.inGameTime));
}

/** Sort sessions by number */
export function getSortedSessions(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => a.number - b.number);
}

/** Get the next session number (max + 1, or 1 if empty) */
export function getNextSessionNumber(sessions: Session[]): number {
  if (sessions.length === 0) return 1;
  return Math.max(...sessions.map(s => s.number)) + 1;
}

/** Export a single session as markdown */
export function exportSessionMarkdown(
  session: Session,
  entries: SessionLogEntry[],
  calendar: CalendarSystem
): string {
  const lines: string[] = [];

  lines.push(`# Session ${session.number}: ${session.title}`);
  lines.push('');
  lines.push(`**Date**: ${session.realWorldDate}`);

  if (session.inGameTimeStart) {
    const start = `${formatDate(calendar, session.inGameTimeStart)} ${formatTime12(session.inGameTimeStart)}`;
    if (session.inGameTimeEnd) {
      const end = `${formatDate(calendar, session.inGameTimeEnd)} ${formatTime12(session.inGameTimeEnd)}`;
      lines.push(`**In-Game Time**: ${start} — ${end}`);
    } else {
      lines.push(`**In-Game Time**: ${start}`);
    }
  }

  if (session.hexesVisited.length > 0) {
    lines.push(`**Hexes Visited**: ${session.hexesVisited.join(', ')}`);
  }

  lines.push('');

  if (session.summary) {
    lines.push('## Summary');
    lines.push('');
    lines.push(session.summary);
    lines.push('');
  }

  if (entries.length > 0) {
    lines.push('## Log Entries');
    lines.push('');

    const sorted = [...entries].sort((a, b) => compareTime(a.inGameTime, b.inGameTime));
    for (const entry of sorted) {
      const time = `${formatDate(calendar, entry.inGameTime)} ${formatTime12(entry.inGameTime)}`;
      const tags = entry.tags.map(t => SESSION_TAG_INFO[t].label).join(', ');
      const hexes = entry.hexKeys.length > 0 ? ` [${entry.hexKeys.join(', ')}]` : '';

      lines.push(`### ${entry.title || 'Untitled'}`);
      lines.push('');
      lines.push(`**Time**: ${time}${hexes}`);
      if (tags) {
        lines.push(`**Tags**: ${tags}`);
      }
      if (entry.description) {
        lines.push('');
        lines.push(entry.description);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/** Export all sessions as markdown */
export function exportAllSessionsMarkdown(
  campaign: Campaign,
  calendar: CalendarSystem
): string {
  const sessions = getSortedSessions(campaign.sessions ?? []);
  const log = campaign.sessionLog ?? [];
  const lines: string[] = [];

  lines.push(`# ${campaign.name} — Session Log`);
  lines.push('');

  for (const session of sessions) {
    const entries = getEntriesForSession(log, session.id);
    lines.push(exportSessionMarkdown(session, entries, calendar));
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
