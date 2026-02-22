// KeyboardShortcutsModal - Shows all keyboard shortcuts
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

interface ShortcutSection {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const isMac = navigator.platform.toLowerCase().includes('mac');
const cmdKey = isMac ? '⌘' : 'Ctrl';

const sections: ShortcutSection[] = [
  {
    title: 'File',
    shortcuts: [
      { keys: `${cmdKey}+N`, description: 'New Campaign' },
      { keys: `${cmdKey}+O`, description: 'Open Campaign' },
      { keys: `${cmdKey}+Shift+O`, description: 'Open in New Window' },
      { keys: `${cmdKey}+S`, description: 'Save' },
      { keys: `${cmdKey}+Shift+S`, description: 'Save As' },
      { keys: `${cmdKey}+E`, description: 'Export Data' },
      { keys: `${cmdKey}+Shift+E`, description: 'Export Map' },
    ],
  },
  {
    title: 'Edit',
    shortcuts: [
      { keys: `${cmdKey}+Z`, description: 'Undo' },
      { keys: `${cmdKey}+Shift+Z`, description: 'Redo' },
      { keys: `${cmdKey}+X`, description: 'Cut' },
      { keys: `${cmdKey}+C`, description: 'Copy' },
      { keys: `${cmdKey}+V`, description: 'Paste' },
      { keys: `${cmdKey}+A`, description: 'Select All' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: `${cmdKey}+K`, description: 'Command Palette' },
      { keys: `${cmdKey}+F`, description: 'Focus Search' },
      { keys: `${cmdKey}++`, description: 'Zoom In' },
      { keys: `${cmdKey}+-`, description: 'Zoom Out' },
      { keys: `${cmdKey}+0`, description: 'Actual Size' },
    ],
  },
  {
    title: 'Campaign',
    shortcuts: [
      { keys: `${cmdKey}+T`, description: 'Time Controls' },
      { keys: `${cmdKey}+W`, description: 'Weather Settings' },
    ],
  },
  {
    title: 'Modals',
    shortcuts: [
      { keys: 'Escape', description: 'Close Modal' },
      { keys: `${cmdKey}+Enter`, description: 'Confirm/Export' },
    ],
  },
];

function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        ref={focusTrapRef}
        className="modal keyboard-shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="shortcuts-modal-title">Keyboard Shortcuts</h3>
          <button
            className="btn btn-icon close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body shortcuts-content">
          {sections.map((section) => (
            <div key={section.title} className="shortcut-section">
              <h4>{section.title}</h4>
              <ul className="shortcut-list">
                {section.shortcuts.map((shortcut) => (
                  <li key={shortcut.keys} className="shortcut-item">
                    <kbd className="shortcut-keys">{shortcut.keys}</kbd>
                    <span className="shortcut-desc">{shortcut.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
