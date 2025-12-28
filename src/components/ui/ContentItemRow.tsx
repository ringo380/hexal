// ContentItemRow - Single content item display
import type { ContentItem } from '../../types';

interface ContentItemRowProps {
  item: ContentItem;
  onToggleResolved: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ContentItemRow({ item, onToggleResolved, onEdit, onDelete }: ContentItemRowProps) {
  return (
    <div className={`content-item ${item.isResolved ? 'resolved' : ''}`}>
      <button
        className="resolve-btn"
        onClick={onToggleResolved}
        title={item.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
      >
        {item.isResolved ? '✓' : '○'}
      </button>
      <div className="item-content" onClick={onEdit}>
        <span className="item-title">{item.title}</span>
        {item.difficulty && (
          <span className="item-difficulty">({item.difficulty})</span>
        )}
        {item.description && (
          <span className="item-description">{item.description}</span>
        )}
      </div>
      <div className="item-actions">
        <button className="edit-btn" onClick={onEdit} title="Edit">✎</button>
        <button className="delete-btn" onClick={onDelete} title="Delete">×</button>
      </div>
    </div>
  );
}

export default ContentItemRow;
