// ProfileMenu — User avatar dropdown with sign-out, or sign-in button

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../stores/AuthContext';
import Icon from '../icons/Icon';

interface ProfileMenuProps {
  onOpenLogin: () => void;
  onOpenAccount: () => void;
}

// Deterministic color from display name for avatar circle
function avatarColor(name: string): string {
  const colors = [
    '#4a9eff', '#4caf50', '#ff9800', '#e91e63',
    '#9c27b0', '#00bcd4', '#ff5722', '#607d8b',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function ProfileMenu({ onOpenLogin, onOpenAccount }: ProfileMenuProps) {
  const { user, isAuthenticated, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!isAuthenticated || !user) {
    return (
      <button
        className="btn btn-secondary"
        onClick={onOpenLogin}
        style={{ padding: '4px 12px', fontSize: 12 }}
      >
        <Icon name="user" size={14} /> Sign In
      </button>
    );
  }

  const initial = (user.displayName || user.email || '?')[0].toUpperCase();
  const color = avatarColor(user.displayName || user.email);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <div
        className="profile-avatar"
        style={{ backgroundColor: color }}
        onClick={() => setOpen(!open)}
        title={user.displayName}
      >
        {initial}
      </div>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-name">{user.displayName}</div>
          <div className="profile-dropdown-email">{user.email}</div>
          <div className="profile-dropdown-divider" />
          <button
            className="btn btn-secondary"
            onClick={() => {
              setOpen(false);
              onOpenAccount();
            }}
            style={{ width: '100%', fontSize: 12, padding: '6px 8px', marginBottom: 4 }}
          >
            Account settings
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleSignOut}
            style={{ width: '100%', fontSize: 12, padding: '6px 8px' }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
