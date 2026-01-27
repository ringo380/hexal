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
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      aria-describedby="unsaved-changes-description"
    >
      <div className="modal unsaved-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="unsaved-changes-title">Unsaved Changes</h3>
        </div>
        <div className="modal-body">
          <p id="unsaved-changes-description">You have unsaved changes. What would you like to do?</p>
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
