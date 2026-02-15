import { useState, useMemo } from 'react';
import { useCampaign } from '../../stores/CampaignContext';
import type { Session, SessionLogEntry, SessionLogTag } from '../../types/Campaign';
import { SESSION_TAG_INFO, createSession, createSessionLogEntry, parseHexKey } from '../../types/Campaign';
import {
  getEntriesForSession,
  getSortedSessions,
  getNextSessionNumber,
  getTimeline,
  filterEntriesByTags,
  exportSessionMarkdown,
  exportAllSessionsMarkdown
} from '../../services/sessionLog';
import { formatDate, formatTime12 } from '../../services/time';
import SessionEntryEditor from '../sessions/SessionEntryEditor';
import SessionTagBadge from '../sessions/SessionTagBadge';
import Icon from '../icons/Icon';

interface SessionLogModalProps {
  onClose: () => void;
  onNavigateToHex?: (hexKey: string) => void;
}

type Tab = 'sessions' | 'timeline' | 'export';

function SessionLogModal({ onClose, onNavigateToHex }: SessionLogModalProps) {
  const { campaign, updateCampaignData, sessions, sessionLog, timeWeather } = useCampaign();
  const [activeTab, setActiveTab] = useState<Tab>('sessions');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Timeline state
  const [timelineTagFilter, setTimelineTagFilter] = useState<SessionLogTag[]>([]);
  const [timelineSearch, setTimelineSearch] = useState('');

  // Export state
  const [exportScope, setExportScope] = useState<'current' | 'all'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const calendar = timeWeather?.calendar;
  const sortedSessions = useMemo(() => getSortedSessions(sessions), [sessions]);
  const selectedSession = selectedSessionId
    ? sessions.find(s => s.id === selectedSessionId)
    : null;
  const selectedSessionEntries = selectedSessionId
    ? getEntriesForSession(sessionLog, selectedSessionId)
    : [];

  // ---- Session CRUD ----

  const addSession = () => {
    const num = getNextSessionNumber(sessions);
    const session = createSession(num);
    if (timeWeather) {
      session.inGameTimeStart = { ...timeWeather.currentTime };
    }
    updateCampaignData({ sessions: [...sessions, session] });
    setSelectedSessionId(session.id);
  };

  const updateSession = (updated: Session) => {
    updateCampaignData({
      sessions: sessions.map(s => s.id === updated.id ? updated : s)
    });
  };

  const deleteSession = (sessionId: string) => {
    updateCampaignData({
      sessions: sessions.filter(s => s.id !== sessionId),
      sessionLog: sessionLog.filter(e => e.sessionId !== sessionId)
    });
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }
  };

  // ---- Entry CRUD ----

  const addEntry = () => {
    if (!selectedSessionId || !timeWeather) return;
    const entry = createSessionLogEntry(selectedSessionId, timeWeather.currentTime);
    updateCampaignData({ sessionLog: [...sessionLog, entry] });
  };

  const updateEntry = (updated: SessionLogEntry) => {
    updateCampaignData({
      sessionLog: sessionLog.map(e => e.id === updated.id ? updated : e)
    });
  };

  const deleteEntry = (entryId: string) => {
    updateCampaignData({
      sessionLog: sessionLog.filter(e => e.id !== entryId)
    });
  };

  // ---- Timeline ----

  const timelineEntries = useMemo(() => {
    let entries = getTimeline(sessionLog);
    if (timelineTagFilter.length > 0) {
      entries = filterEntriesByTags(entries, timelineTagFilter);
    }
    if (timelineSearch.trim()) {
      const q = timelineSearch.toLowerCase();
      entries = entries.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    }
    return entries;
  }, [sessionLog, timelineTagFilter, timelineSearch]);

  // Group timeline entries by in-game date
  const timelineGroups = useMemo(() => {
    if (!calendar) return [];
    const groups: { dateKey: string; dateLabel: string; entries: SessionLogEntry[] }[] = [];
    let currentDateKey = '';
    for (const entry of timelineEntries) {
      const dateKey = `${entry.inGameTime.year}-${entry.inGameTime.month}-${entry.inGameTime.day}`;
      if (dateKey !== currentDateKey) {
        currentDateKey = dateKey;
        groups.push({
          dateKey,
          dateLabel: formatDate(calendar, entry.inGameTime),
          entries: [entry]
        });
      } else {
        groups[groups.length - 1].entries.push(entry);
      }
    }
    return groups;
  }, [timelineEntries, calendar]);

  const getSessionForEntry = (entry: SessionLogEntry): Session | undefined =>
    sessions.find(s => s.id === entry.sessionId);

  const toggleTimelineTag = (tag: SessionLogTag) => {
    setTimelineTagFilter(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // ---- Export ----

  const handleExport = async () => {
    if (!campaign || !calendar) return;
    setExportError(null);
    setIsExporting(true);

    try {
      let content: string;
      let filename: string;

      if (exportScope === 'current' && selectedSession) {
        const entries = getEntriesForSession(sessionLog, selectedSession.id);
        content = exportSessionMarkdown(selectedSession, entries, calendar);
        filename = `${campaign.name} - Session ${selectedSession.number}.md`;
      } else {
        content = exportAllSessionsMarkdown(campaign, calendar);
        filename = `${campaign.name} - Session Log.md`;
      }

      const filePath = await window.electronAPI.saveFileDialog(filename);
      if (!filePath) {
        setIsExporting(false);
        return;
      }

      const result = await window.electronAPI.saveFile(filePath, content);
      if (result.success) {
        setExportSuccess(true);
        setIsExporting(false);
        setTimeout(() => setExportSuccess(false), 2000);
      } else {
        throw new Error(result.error || 'Failed to save file');
      }
    } catch (err) {
      setExportError(`Export failed: ${err}`);
      setIsExporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl session-log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Icon name="calendar" size={18} /> Session Log</h3>
          <div className="session-log-tabs">
            <button
              className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              Sessions ({sessions.length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
            <button
              className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              Export
            </button>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {activeTab === 'sessions' && (
          <div className="session-log-body">
            {/* Left panel: Session list */}
            <div className="session-list-panel">
              <button className="btn btn-primary btn-small" onClick={addSession} style={{ margin: '8px' }}>
                + New Session
              </button>
              <div className="session-list-items">
                {sortedSessions.map(session => (
                  <div
                    key={session.id}
                    className={`session-list-item ${session.id === selectedSessionId ? 'selected' : ''}`}
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="session-list-item-header">
                      <span className="session-list-item-number">#{session.number}</span>
                      <span className="session-list-item-title">{session.title}</span>
                    </div>
                    <div className="session-list-item-date">{session.realWorldDate}</div>
                    <button
                      className="btn-icon-small danger"
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                      title="Delete session"
                    >
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                ))}
                {sortedSessions.length === 0 && (
                  <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                    No sessions yet
                  </div>
                )}
              </div>
            </div>

            {/* Right panel: Session editor */}
            <div className="session-detail-panel">
              {selectedSession ? (
                <SessionEditor
                  session={selectedSession}
                  entries={selectedSessionEntries}
                  calendar={calendar}
                  onUpdateSession={updateSession}
                  onAddEntry={addEntry}
                  onUpdateEntry={updateEntry}
                  onDeleteEntry={deleteEntry}
                  onNavigateToHex={onNavigateToHex}
                />
              ) : (
                <div className="empty-state">
                  <Icon name="calendar" size={32} />
                  <p>Select a session or create a new one</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="session-log-body timeline-body">
            <div className="timeline-toolbar">
              <input
                type="text"
                className="timeline-search"
                placeholder="Search entries..."
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
              />
              <div className="tag-filter-bar">
                {(Object.keys(SESSION_TAG_INFO) as SessionLogTag[]).map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter-chip ${timelineTagFilter.includes(tag) ? 'active' : ''}`}
                    style={timelineTagFilter.includes(tag) ? {
                      backgroundColor: `${SESSION_TAG_INFO[tag].color}22`,
                      color: SESSION_TAG_INFO[tag].color,
                      borderColor: `${SESSION_TAG_INFO[tag].color}44`
                    } : undefined}
                    onClick={() => toggleTimelineTag(tag)}
                  >
                    <Icon name={SESSION_TAG_INFO[tag].icon} size={10} />
                    {SESSION_TAG_INFO[tag].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="timeline-view">
              {timelineGroups.length === 0 && (
                <div style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  {sessionLog.length === 0 ? 'No log entries yet' : 'No entries match filters'}
                </div>
              )}
              {timelineGroups.map(group => (
                <div key={group.dateKey} className="timeline-date-group">
                  <div className="timeline-date-header">{group.dateLabel}</div>
                  {group.entries.map(entry => {
                    const session = getSessionForEntry(entry);
                    return (
                      <div key={entry.id} className="timeline-entry">
                        <span className="timeline-entry-time">
                          {formatTime12(entry.inGameTime)}
                        </span>
                        <div className="timeline-entry-content">
                          <div className="timeline-entry-title">{entry.title || 'Untitled'}</div>
                          {entry.tags.length > 0 && (
                            <div className="timeline-entry-tags">
                              {entry.tags.map(tag => (
                                <SessionTagBadge key={tag} tag={tag} customTag={entry.customTag} size="small" />
                              ))}
                            </div>
                          )}
                          {entry.hexKeys.length > 0 && (
                            <div className="timeline-entry-hexes">
                              {entry.hexKeys.map(key => (
                                <span
                                  key={key}
                                  className="hex-link-chip"
                                  onClick={() => onNavigateToHex?.(key)}
                                >
                                  ({key})
                                </span>
                              ))}
                            </div>
                          )}
                          {session && (
                            <span className="timeline-entry-session">Session #{session.number}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="session-log-body export-body">
            <div className="export-panel">
              <div className="field-group">
                <label>Scope</label>
                <select
                  value={exportScope}
                  onChange={(e) => setExportScope(e.target.value as 'current' | 'all')}
                >
                  <option value="all">All Sessions</option>
                  {selectedSession && (
                    <option value="current">Session #{selectedSession.number}: {selectedSession.title}</option>
                  )}
                </select>
              </div>

              <p className="hint">
                Exports session log as Markdown for easy reading and sharing.
              </p>

              {exportError && <div className="error-message">{exportError}</div>}
              {exportSuccess && <div className="success-message">Export successful!</div>}

              <button
                className="btn btn-primary"
                onClick={handleExport}
                disabled={isExporting || !calendar}
              >
                {isExporting ? 'Exporting...' : 'Export...'}
              </button>

              {!calendar && (
                <p className="hint" style={{ color: 'var(--color-warning)' }}>
                  Calendar system required for export. Initialize time/weather first.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Session Editor sub-component ----

interface SessionEditorProps {
  session: Session;
  entries: SessionLogEntry[];
  calendar?: import('../../types/Weather').CalendarSystem;
  onUpdateSession: (updated: Session) => void;
  onAddEntry: () => void;
  onUpdateEntry: (updated: SessionLogEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onNavigateToHex?: (hexKey: string) => void;
}

function SessionEditor({
  session, entries, calendar,
  onUpdateSession, onAddEntry, onUpdateEntry, onDeleteEntry, onNavigateToHex
}: SessionEditorProps) {
  const [hexInput, setHexInput] = useState('');

  const addVisitedHex = () => {
    const trimmed = hexInput.trim();
    if (!trimmed) return;
    const parsed = parseHexKey(trimmed);
    if (!parsed) return;
    const key = `${parsed.q},${parsed.r}`;
    if (session.hexesVisited.includes(key)) return;
    onUpdateSession({ ...session, hexesVisited: [...session.hexesVisited, key] });
    setHexInput('');
  };

  return (
    <div className="session-editor">
      <div className="field-group">
        <label>Title</label>
        <input
          type="text"
          value={session.title}
          onChange={(e) => onUpdateSession({ ...session, title: e.target.value })}
        />
      </div>

      <div className="field-group">
        <label>Real-World Date</label>
        <input
          type="date"
          value={session.realWorldDate}
          onChange={(e) => onUpdateSession({ ...session, realWorldDate: e.target.value })}
        />
      </div>

      <div className="field-group">
        <label>Summary</label>
        <textarea
          value={session.summary}
          onChange={(e) => onUpdateSession({ ...session, summary: e.target.value })}
          rows={3}
          placeholder="Session summary..."
        />
      </div>

      <div className="field-group">
        <label>Hexes Visited</label>
        <div className="session-entry-hex-chips">
          {session.hexesVisited.map(key => (
            <span key={key} className="hex-link-chip" onClick={() => onNavigateToHex?.(key)}>
              ({key})
              <button
                className="hex-link-chip-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateSession({
                    ...session,
                    hexesVisited: session.hexesVisited.filter(k => k !== key)
                  });
                }}
              >
                &times;
              </button>
            </span>
          ))}
          <div className="session-entry-hex-add">
            <input
              type="text"
              placeholder="q,r"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addVisitedHex(); }}
              style={{ width: '60px', fontSize: '12px' }}
            />
            <button className="btn btn-small" onClick={addVisitedHex}>+ Hex</button>
          </div>
        </div>
      </div>

      <label className="checkbox-label" style={{ fontSize: '12px' }}>
        <input
          type="checkbox"
          checked={session.isVisibleToPlayers}
          onChange={(e) => onUpdateSession({ ...session, isVisibleToPlayers: e.target.checked })}
        />
        Visible to Players
      </label>

      <div className="session-entries-section">
        <div className="section-header" style={{ cursor: 'default' }}>
          <span className="section-icon"><Icon name="clock" size={14} /></span>
          <span className="section-title">Log Entries</span>
          <span className="section-count">{entries.length}</span>
        </div>
        <div className="session-entries-list">
          {entries.map(entry => (
            <SessionEntryEditor
              key={entry.id}
              entry={entry}
              calendar={calendar}
              onChange={onUpdateEntry}
              onDelete={() => onDeleteEntry(entry.id)}
              onNavigateToHex={onNavigateToHex}
            />
          ))}
          <button className="add-item-btn" onClick={onAddEntry}>
            + Add Log Entry
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionLogModal;
