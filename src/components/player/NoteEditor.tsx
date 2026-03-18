// NoteEditor — Create/edit a player journal note

import { useState } from 'react';
import type { PlayerNote } from '../../types';

interface NoteEditorProps {
  note: PlayerNote;
  onSave: (note: PlayerNote) => void;
  onCancel: () => void;
}

function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagsInput, setTagsInput] = useState(note.tags.join(', '));
  const [linkedHexKeysInput, setLinkedHexKeysInput] = useState(note.linkedHexKeys.join(', '));
  const [linkedNpcNamesInput, setLinkedNpcNamesInput] = useState(note.linkedNpcNames.join(', '));

  const handleSave = () => {
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const linkedHexKeys = linkedHexKeysInput.split(',').map(k => k.trim()).filter(Boolean);
    const linkedNpcNames = linkedNpcNamesInput.split(',').map(n => n.trim()).filter(Boolean);

    onSave({
      ...note,
      title,
      content,
      tags,
      linkedHexKeys,
      linkedNpcNames,
      modifiedAt: new Date().toISOString()
    });
  };

  return (
    <div className="player-note-editor">
      <div className="player-note-editor-field">
        <label htmlFor="note-title">Title</label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          autoFocus
        />
      </div>

      <div className="player-note-editor-field">
        <label htmlFor="note-content">Content</label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your notes here..."
          rows={10}
        />
      </div>

      <div className="player-note-editor-field">
        <label htmlFor="note-tags">Tags (comma-separated)</label>
        <input
          id="note-tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. quest, important, lore"
        />
      </div>

      <div className="player-note-editor-field">
        <label htmlFor="note-hex-keys">Linked Hex Keys (comma-separated)</label>
        <input
          id="note-hex-keys"
          type="text"
          value={linkedHexKeysInput}
          onChange={(e) => setLinkedHexKeysInput(e.target.value)}
          placeholder="e.g. 3,4 or 5,6"
        />
      </div>

      <div className="player-note-editor-field">
        <label htmlFor="note-npc-names">Linked NPC Names (comma-separated)</label>
        <input
          id="note-npc-names"
          type="text"
          value={linkedNpcNamesInput}
          onChange={(e) => setLinkedNpcNamesInput(e.target.value)}
          placeholder="e.g. Gandalf, Elrond"
        />
      </div>

      <div className="player-note-editor-actions">
        <button className="player-note-btn player-note-btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="player-note-btn player-note-btn-primary" onClick={handleSave} disabled={!title.trim()}>
          Save
        </button>
      </div>
    </div>
  );
}

export default NoteEditor;
