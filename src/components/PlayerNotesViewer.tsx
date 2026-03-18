// PlayerNotesViewer — DM-side read-only viewer for player journal notes

import { useState } from 'react';
import type { PlayerNote } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface PlayerNotesViewerProps {
  notes: PlayerNote[];
  onClose: () => void;
}

function PlayerNotesViewer({ notes, onClose }: PlayerNotesViewerProps) {
  const modalRef = useFocusTrap({ onEscape: onClose });
  const [filterPlayer, setFilterPlayer] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique player names
  const playerNames = Array.from(new Set(notes.map(n => n.playerName))).sort();

  const filteredNotes = notes
    .filter(n => !filterPlayer || n.playerName === filterPlayer)
    .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal player-notes-viewer-modal" ref={modalRef}>
        <div className="modal-header">
          <h2>Player Notes</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close player notes viewer">
            &times;
          </button>
        </div>

        <div className="player-notes-viewer-controls">
          <input
            type="text"
            className="player-notes-viewer-search"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search player notes"
            autoFocus
          />
          {playerNames.length > 1 && (
            <select
              value={filterPlayer}
              onChange={(e) => setFilterPlayer(e.target.value)}
              aria-label="Filter by player"
              className="player-notes-viewer-filter"
            >
              <option value="">All Players</option>
              {playerNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="player-notes-viewer-list">
          {filteredNotes.length === 0 ? (
            <p className="empty-hint">
              {notes.length === 0
                ? 'No player notes have been submitted yet.'
                : 'No notes match your filters.'}
            </p>
          ) : (
            filteredNotes.map(note => (
              <div key={note.id} className="player-notes-viewer-item">
                <div className="player-notes-viewer-item-header">
                  <span className="player-notes-viewer-item-title">{note.title || 'Untitled'}</span>
                  <span className="player-notes-viewer-item-player">{note.playerName}</span>
                </div>
                <div className="player-notes-viewer-item-meta">
                  {new Date(note.modifiedAt).toLocaleDateString()}
                  {note.tags.length > 0 && (
                    <span className="player-notes-viewer-tags">
                      {note.tags.map(tag => (
                        <span key={tag} className="player-notes-viewer-tag">{tag}</span>
                      ))}
                    </span>
                  )}
                </div>
                <div className="player-notes-viewer-item-content">
                  {note.content || 'No content.'}
                </div>
                {(note.linkedHexKeys.length > 0 || note.linkedNpcNames.length > 0 || note.linkedQuestIds.length > 0) && (
                  <div className="player-notes-viewer-item-links">
                    {note.linkedHexKeys.length > 0 && (
                      <span>Hexes: {note.linkedHexKeys.join(', ')}</span>
                    )}
                    {note.linkedNpcNames.length > 0 && (
                      <span>NPCs: {note.linkedNpcNames.join(', ')}</span>
                    )}
                    {note.linkedQuestIds.length > 0 && (
                      <span>Quests: {note.linkedQuestIds.length}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerNotesViewer;
