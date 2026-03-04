// ContentItemRow - Single content item with inline editing support
import { memo } from 'react';
import type { ContentItem } from '../../types';
import Icon from '../icons/Icon';
import { onActivate } from '../../utils/keyboard';
import { useInlineEdit } from '../../hooks/useInlineEdit';

interface ContentItemRowProps {
  item: ContentItem;
  onToggleResolved: () => void;
  onSave: (item: ContentItem) => void;
  onDelete: () => void;
}

function ContentItemRow({ item, onToggleResolved, onSave, onDelete }: ContentItemRowProps) {
  const { isEditing, draft, setDraft, startEditing, save, cancel, containerRef } = useInlineEdit<ContentItem>({ onSave });

  if (isEditing && draft) {
    return (
      <div className="inline-edit-form" ref={containerRef}>
        <div className="field-group">
          <label>Title</label>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            autoFocus
          />
        </div>
        <div className="field-group">
          <label>Difficulty / CR</label>
          <input
            type="text"
            value={draft.difficulty ?? ''}
            onChange={(e) => setDraft({ ...draft, difficulty: e.target.value || undefined })}
            placeholder="e.g., CR 2, Easy"
          />
        </div>
        <div className="field-group">
          <label>Description</label>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
          />
        </div>
        <div className="inline-edit-actions">
          <button className="btn btn-secondary btn-small" onClick={cancel}>Cancel</button>
          <button className="btn btn-primary btn-small" onClick={save}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`content-item ${item.isResolved ? 'resolved' : ''}`}>
      <button
        className="resolve-btn"
        onClick={onToggleResolved}
        title={item.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
        aria-label={item.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
      >
        <Icon name={item.isResolved ? 'check' : 'circle'} size={14} />
      </button>
      <div className="item-content" role="button" tabIndex={0} aria-label={`Edit ${item.title}`} onClick={() => startEditing(item)} onKeyDown={onActivate(() => startEditing(item))}>
        <span className="item-title">{item.title}</span>
        {item.difficulty && (
          <span className="item-difficulty">({item.difficulty})</span>
        )}
        {item.description && (
          <span className="item-description">{item.description}</span>
        )}
      </div>
      <div className="item-actions">
        <button className="edit-btn" onClick={() => startEditing(item)} title="Edit" aria-label="Edit">
          <Icon name="pencil" size={14} />
        </button>
        <button className="delete-btn" onClick={onDelete} title="Delete" aria-label="Delete">
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
}

function areEqual(prev: ContentItemRowProps, next: ContentItemRowProps) {
  return prev.item === next.item;
}

export default memo(ContentItemRow, areEqual);
