// PlayerJournal — Journal panel for players to create and manage notes

import { useState } from 'react';
import type { PlayerNote } from '../../types';
import { createPlayerNote } from '../../types';
import NoteEditor from './NoteEditor';

interface PlayerJournalProps {
  notes: PlayerNote[];
  playerName: string;
  onSave: (note: PlayerNote) => void;
  onClose: () => void;
}

function PlayerJournal({ notes, playerName, onSave, onClose }: PlayerJournalProps) {
  const [editingNote, setEditingNote] = useState<PlayerNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter notes for this player
  const myNotes = notes
    .filter(n => n.playerName === playerName)
    .filter(n => !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

  const handleNewNote = () => {
    setEditingNote(createPlayerNote(playerName));
  };

  const handleSave = (note: PlayerNote) => {
    onSave(note);
    setEditingNote(null);
  };

  const handleCancel = () => {
    setEditingNote(null);
  };

  if (editingNote) {
    return (
      <div className="player-journal">
        <div className="player-journal-header">
          <h2>Edit Note</h2>
          <button className="player-journal-close" onClick={handleCancel} aria-label="Cancel editing">
            &times;
          </button>
        </div>
        <NoteEditor note={editingNote} onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="player-journal">
      <div className="player-journal-header">
        <h2>Journal</h2>
        <button className="player-journal-close" onClick={onClose} aria-label="Close journal">
          &times;
        </button>
      </div>

      <div className="player-journal-controls">
        <input
          type="text"
          className="player-journal-search"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search journal notes"
        />
        <button className="player-note-btn player-note-btn-primary" onClick={handleNewNote}>
          New Note
        </button>
      </div>

      <div className="player-journal-list">
        {myNotes.length === 0 ? (
          <p className="player-journal-empty">
            {searchQuery ? 'No notes match your search.' : 'No journal entries yet. Create your first note!'}
          </p>
        ) : (
          myNotes.map(note => (
            <div
              key={note.id}
              className="player-journal-item"
              role="button"
              tabIndex={0}
              onClick={() => setEditingNote(note)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEditingNote(note);
                }
              }}
            >
              <div className="player-journal-item-title">{note.title || 'Untitled'}</div>
              <div className="player-journal-item-meta">
                {new Date(note.modifiedAt).toLocaleDateString()}
                {note.tags.length > 0 && (
                  <span className="player-journal-item-tags">
                    {note.tags.map(tag => (
                      <span key={tag} className="player-journal-tag">{tag}</span>
                    ))}
                  </span>
                )}
              </div>
              {note.content && (
                <div className="player-journal-item-preview">
                  {note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default PlayerJournal;
