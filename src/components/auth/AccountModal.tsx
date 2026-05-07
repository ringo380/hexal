// AccountModal — Wraps Clerk <UserProfile /> for account management
// (change password, manage emails, active sessions, delete account).

import { UserProfile } from '@clerk/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Icon from '../icons/Icon';

interface AccountModalProps {
  onClose: () => void;
}

const darkAppearance = {
  variables: {
    colorBackground: '#1e1e1e',
    colorInputBackground: '#2a2a2a',
    colorText: '#e0e0e0',
    colorTextSecondary: '#a0a0a0',
    colorPrimary: '#4a9eff',
    colorInputText: '#e0e0e0',
    colorNeutral: '#3a3a3a',
    borderRadius: '6px',
  },
} as const;

function AccountModal({ onClose }: AccountModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      onClick={onClose}
    >
      <div
        ref={focusTrapRef}
        className="modal account-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="account-modal-title">
            <Icon name="user" size={18} /> Account Settings
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <div className="modal-body account-modal-body">
          <UserProfile appearance={darkAppearance} routing="hash" />
        </div>
      </div>
    </div>
  );
}

export default AccountModal;
