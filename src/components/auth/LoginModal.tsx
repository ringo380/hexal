// LoginModal — OAuth sign-in modal (Google, GitHub, Apple)

import { useState } from 'react';
import { useSignIn } from '@clerk/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Icon from '../icons/Icon';

interface LoginModalProps {
  onClose: () => void;
}

type OAuthStrategy = 'oauth_google' | 'oauth_github' | 'oauth_apple';

const providers: { strategy: OAuthStrategy; label: string; icon: string }[] = [
  { strategy: 'oauth_google', label: 'Continue with Google', icon: 'sparkle' },
  { strategy: 'oauth_github', label: 'Continue with GitHub', icon: 'scroll' },
  { strategy: 'oauth_apple', label: 'Continue with Apple', icon: 'shield' },
];

function LoginModal({ onClose }: LoginModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const { signIn } = useSignIn();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (!signIn) return;

    setError('');
    setSubmitting(true);
    try {
      // Open OAuth in a popup window instead of redirecting the Electron main window.
      // Clerk v6 natively supports a `popup` param on signIn.sso().
      const popup = window.open('about:blank', '_blank', 'width=500,height=700');
      if (!popup) {
        throw new Error('Could not open popup window. Check your popup blocker settings.');
      }

      const { error: ssoError } = await signIn.sso({
        strategy,
        popup,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectCallbackUrl: '/',
      });

      if (ssoError) {
        throw new Error(ssoError.message ?? 'SSO authentication failed');
      }

      // signIn.sso() with popup resolves once the OAuth flow completes.
      // If sign-in is complete, finalize it to set the active session.
      if (signIn.status === 'complete') {
        await signIn.finalize();
        onClose();
      } else {
        setSubmitting(false);
      }
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error('OAuth error:', err);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" onClick={onClose}>
      <div
        ref={focusTrapRef}
        className="modal login-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 360 }}
      >
        <div className="modal-header">
          <h3 id="login-modal-title">
            <Icon name="user" size={18} /> Sign In
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">x</button>
        </div>

        <div className="modal-body">
          {error && <div className="auth-error">{error}</div>}

          <div className="oauth-buttons-vertical">
            {providers.map(({ strategy, label, icon }) => (
              <button
                key={strategy}
                className="oauth-btn-large"
                onClick={() => handleOAuth(strategy)}
                disabled={submitting}
              >
                <Icon name={icon as any} size={16} />
                {submitting ? 'Signing in...' : label}
              </button>
            ))}
          </div>

          <p className="auth-hint">
            Sign in to sync campaigns across devices.
            The app works fully offline without an account.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
