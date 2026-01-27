// ContentItemRow - Single content item display
import type { ContentItem } from '../../types';
import Icon from '../icons/Icon';

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
        aria-label={item.isResolved ? 'Mark as unresolved' : 'Mark as resolved'}
      >
        <Icon name={item.isResolved ? 'check' : 'circle'} size={14} />
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
        <button className="edit-btn" onClick={onEdit} title="Edit" aria-label="Edit">
          <Icon name="pencil" size={14} />
        </button>
        <button className="delete-btn" onClick={onDelete} title="Delete" aria-label="Delete">
          <Icon name="close" size={14} />
        </button>
      </div>
    </div>
  );
}

export default ContentItemRow;
