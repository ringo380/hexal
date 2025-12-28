// UnsavedChangesDialog - Shown when user tries to close/switch with unsaved changes

interface UnsavedChangesDialogProps {
  onSave: () => void;
  onDontSave: () => void;
  onOpenNewWindow?: () => void;
  onCancel: () => void;
}

function UnsavedChangesDialog({
  onSave,
  onDontSave,
  onOpenNewWindow,
  onCancel
}: UnsavedChangesDialogProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal unsaved-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Unsaved Changes</h3>
        </div>
        <div className="modal-body">
          <p>You have unsaved changes. What would you like to do?</p>
        </div>
        <div className="modal-footer unsaved-dialog-buttons">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          {onOpenNewWindow && (
            <button className="btn btn-secondary" onClick={onOpenNewWindow}>
              Open in New Window
            </button>
          )}
          <button className="btn btn-secondary" onClick={onDontSave}>
            Don't Save
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesDialog;
