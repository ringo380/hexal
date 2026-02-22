// AlertDialog - Reusable alert modal to replace browser alert()
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface AlertDialogProps {
  title: string;
  message: string;
  variant?: 'info' | 'error' | 'success' | 'warning';
  buttonLabel?: string;
  onClose: () => void;
}

function AlertDialog({
  title,
  message,
  variant = 'info',
  buttonLabel = 'OK',
  onClose
}: AlertDialogProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  const variantClasses: Record<string, string> = {
    info: '',
    error: 'alert-dialog-error',
    success: 'alert-dialog-success',
    warning: 'alert-dialog-warning'
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-message"
    >
      <div
        ref={focusTrapRef}
        className={`modal alert-dialog ${variantClasses[variant]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="alert-dialog-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p id="alert-dialog-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={onClose}
            autoFocus
            aria-label={buttonLabel}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertDialog;
