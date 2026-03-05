// LoginModal — Sign in / Sign up modal with OAuth support

import { useState } from 'react';
import { useAuth } from '../../stores/AuthContext';
import { useSettings } from '../../stores/SettingsContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Icon from '../icons/Icon';

interface LoginModalProps {
  onClose: () => void;
}

type AuthTab = 'signin' | 'signup';

function LoginModal({ onClose }: LoginModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const { signIn, signUp, signInWithOAuth, loading } = useAuth();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up form state
  const [signUpDisplayName, setSignUpDisplayName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  const cloudConfigured = Boolean(settings.cloud.supabaseUrl);

  const handleSignIn = async () => {
    if (!signInEmail || !signInPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await signIn(signInEmail, signInPassword);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpDisplayName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await signUp(signUpEmail, signUpPassword, signUpDisplayName);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'discord') => {
    setError('');
    setSubmitting(true);
    try {
      const result = await signInWithOAuth(provider);
      if (result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeTab === 'signin') {
        handleSignIn();
      } else {
        handleSignUp();
      }
    }
  };

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="login-modal-title" onClick={onClose}>
      <div
        ref={focusTrapRef}
        className="modal login-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{ width: 400 }}
      >
        <div className="modal-header">
          <h3 id="login-modal-title">
            <Icon name="user" size={18} /> Account
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!cloudConfigured ? (
          <div className="modal-body">
            <p className="settings-hint" style={{ textAlign: 'center', padding: '24px 0' }}>
              Cloud sync is not configured. Go to Settings &gt; Cloud to set up your Supabase connection.
            </p>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={`tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
                onClick={() => switchTab('signin')}
              >
                Sign In
              </button>
              <button
                className={`tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => switchTab('signup')}
              >
                Sign Up
              </button>
            </div>

            <div className="modal-body">
              {error && <div className="auth-error">{error}</div>}

              {activeTab === 'signin' && (
                <div className="auth-form">
                  <label className="settings-label">
                    Email
                    <input
                      type="email"
                      className="settings-input"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoFocus
                      disabled={submitting}
                    />
                  </label>
                  <label className="settings-label">
                    Password
                    <input
                      type="password"
                      className="settings-input"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Your password"
                      disabled={submitting}
                    />
                  </label>
                  <button
                    className="btn btn-primary"
                    onClick={handleSignIn}
                    disabled={submitting || loading}
                    style={{ width: '100%' }}
                  >
                    {submitting ? 'Signing in...' : 'Sign In'}
                  </button>

                  <div className="auth-divider">or continue with</div>

                  <div className="oauth-buttons">
                    <button
                      className="oauth-btn"
                      onClick={() => handleOAuth('google')}
                      disabled={submitting}
                    >
                      Google
                    </button>
                    <button
                      className="oauth-btn"
                      onClick={() => handleOAuth('github')}
                      disabled={submitting}
                    >
                      GitHub
                    </button>
                    <button
                      className="oauth-btn"
                      onClick={() => handleOAuth('discord')}
                      disabled={submitting}
                    >
                      Discord
                    </button>
                  </div>

                  <div className="auth-switch">
                    Don't have an account?{' '}
                    <button onClick={() => switchTab('signup')}>Sign Up</button>
                  </div>
                </div>
              )}

              {activeTab === 'signup' && (
                <div className="auth-form">
                  <label className="settings-label">
                    Display Name
                    <input
                      type="text"
                      className="settings-input"
                      value={signUpDisplayName}
                      onChange={(e) => setSignUpDisplayName(e.target.value)}
                      placeholder="Your name"
                      autoFocus
                      disabled={submitting}
                    />
                  </label>
                  <label className="settings-label">
                    Email
                    <input
                      type="email"
                      className="settings-input"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={submitting}
                    />
                  </label>
                  <label className="settings-label">
                    Password
                    <input
                      type="password"
                      className="settings-input"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      disabled={submitting}
                    />
                  </label>
                  <label className="settings-label">
                    Confirm Password
                    <input
                      type="password"
                      className="settings-input"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      disabled={submitting}
                    />
                  </label>
                  <button
                    className="btn btn-primary"
                    onClick={handleSignUp}
                    disabled={submitting || loading}
                    style={{ width: '100%' }}
                  >
                    {submitting ? 'Creating account...' : 'Create Account'}
                  </button>

                  <div className="auth-switch">
                    Already have an account?{' '}
                    <button onClick={() => switchTab('signin')}>Sign In</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
