// LoginModal — Email/password + OAuth sign-in
// Tabs: Email (sign-in / sign-up / forgot) and OAuth (Google, GitHub, Apple).

import { useState } from 'react';
import { useSignIn, useSignUp } from '@clerk/react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import Icon from '../icons/Icon';

interface LoginModalProps {
  onClose: () => void;
}

type AuthTab = 'email' | 'oauth';
type EmailMode =
  | 'signin'
  | 'signup'
  | 'signup-verify'
  | 'forgot'
  | 'forgot-verify'
  | 'forgot-reset';

type OAuthStrategy = 'oauth_google' | 'oauth_github' | 'oauth_apple';

const providers: { strategy: OAuthStrategy; label: string; icon: string }[] = [
  { strategy: 'oauth_google', label: 'Continue with Google', icon: 'sparkle' },
  { strategy: 'oauth_github', label: 'Continue with GitHub', icon: 'scroll' },
  { strategy: 'oauth_apple', label: 'Continue with Apple', icon: 'shield' },
];

function LoginModal({ onClose }: LoginModalProps) {
  const focusTrapRef = useFocusTrap<HTMLDivElement>({ onEscape: onClose });
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [tab, setTab] = useState<AuthTab>('email');
  const [mode, setMode] = useState<EmailMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetState = () => {
    setError('');
    setCode('');
    setPassword('');
  };

  const errorMessage = (e: unknown, fallback: string): string => {
    if (e && typeof e === 'object' && 'message' in e) {
      const m = (e as { message?: string }).message;
      if (m) return m;
    }
    return fallback;
  };

  // -------- OAuth --------

  const handleOAuth = async (strategy: OAuthStrategy) => {
    if (!signIn) return;
    setError('');
    setSubmitting(true);
    let popup: Window | null = null;
    try {
      popup = window.open('about:blank', '_blank', 'width=500,height=700');
      if (!popup) {
        throw new Error('Could not open popup window. Check your popup blocker settings.');
      }

      const { error: ssoError } = await signIn.sso({
        strategy,
        popup,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectCallbackUrl: '/',
      });
      if (ssoError) throw new Error(ssoError.message ?? 'SSO authentication failed');

      if (signIn.status === 'complete') {
        await signIn.finalize();
        onClose();
      } else {
        setError('Additional verification required. Try a different method.');
        setSubmitting(false);
      }
    } catch (err) {
      setError(errorMessage(err, 'Sign-in failed. Please try again.'));
      console.error('OAuth error:', err);
      setSubmitting(false);
    } finally {
      if (popup && !popup.closed) popup.close();
    }
  };

  // -------- Sign in --------

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const { error: pwError } = await signIn.password({ identifier: email, password });
      if (pwError) throw pwError;

      if (signIn.status === 'complete') {
        await signIn.finalize();
        onClose();
      } else {
        setError(
          'Additional verification is required to complete sign-in. Manage 2FA in your account settings.'
        );
      }
    } catch (err) {
      setError(errorMessage(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  };

  // -------- Sign up --------

  const handleSignUpStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const { error: pwError } = await signUp.password({ emailAddress: email, password });
      if (pwError) throw pwError;

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) throw sendError;

      setMode('signup-verify');
    } catch (err) {
      setError(errorMessage(err, 'Could not create account. Please check your email and password.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignUpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const { error: vErr } = await signUp.verifications.verifyEmailCode({ code });
      if (vErr) throw vErr;

      if (signUp.status === 'complete') {
        await signUp.finalize();
        onClose();
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err) {
      setError(errorMessage(err, 'Invalid or expired code.'));
    } finally {
      setSubmitting(false);
    }
  };

  // -------- Forgot password --------

  const handleForgotStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const { error: createError } = await signIn.create({ identifier: email });
      if (createError) throw createError;

      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) throw sendError;

      setMode('forgot-verify');
    } catch (err) {
      setError(errorMessage(err, 'Could not send reset code. Check the email and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const { error: vErr } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (vErr) throw vErr;
      setMode('forgot-reset');
    } catch (err) {
      setError(errorMessage(err, 'Invalid or expired code.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const { error: rErr } = await signIn.resetPasswordEmailCode.submitPassword({ password });
      if (rErr) throw rErr;

      if (signIn.status === 'complete') {
        await signIn.finalize();
        onClose();
      } else {
        setError('Password reset incomplete. Please try again.');
      }
    } catch (err) {
      setError(errorMessage(err, 'Could not reset password.'));
    } finally {
      setSubmitting(false);
    }
  };

  // -------- Render helpers --------

  const switchMode = (next: EmailMode) => {
    resetState();
    setMode(next);
  };

  const switchTab = (next: AuthTab) => {
    setTab(next);
    setMode('signin');
    resetState();
  };

  const renderEmailTab = () => {
    switch (mode) {
      case 'signin':
        return (
          <form onSubmit={handleSignIn} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchMode('forgot')}>
                Forgot password?
              </button>
              <button type="button" className="auth-link" onClick={() => switchMode('signup')}>
                Create account
              </button>
            </div>
          </form>
        );

      case 'signup':
        return (
          <form onSubmit={handleSignUpStart} className="auth-form">
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                Already have an account? Sign in
              </button>
            </div>
          </form>
        );

      case 'signup-verify':
        return (
          <form onSubmit={handleSignUpVerify} className="auth-form">
            <p className="auth-hint">
              We sent a 6-digit code to <strong>{email}</strong>.
            </p>
            <label className="auth-field">
              <span>Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                autoFocus
              />
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify & sign in'}
            </button>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchMode('signup')}>
                Back
              </button>
            </div>
          </form>
        );

      case 'forgot':
        return (
          <form onSubmit={handleForgotStart} className="auth-form">
            <p className="auth-hint">Enter your email — we'll send a reset code.</p>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send reset code'}
            </button>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                Back to sign in
              </button>
            </div>
          </form>
        );

      case 'forgot-verify':
        return (
          <form onSubmit={handleForgotVerify} className="auth-form">
            <p className="auth-hint">
              Enter the code we sent to <strong>{email}</strong>.
            </p>
            <label className="auth-field">
              <span>Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                autoFocus
              />
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify code'}
            </button>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchMode('forgot')}>
                Back
              </button>
            </div>
          </form>
        );

      case 'forgot-reset':
        return (
          <form onSubmit={handleForgotReset} className="auth-form">
            <label className="auth-field">
              <span>New password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Set password & sign in'}
            </button>
            <div className="auth-links">
              <button type="button" className="auth-link" onClick={() => switchMode('signin')}>
                Back to sign in
              </button>
            </div>
          </form>
        );

      default: {
        const _exhaustive: never = mode;
        void _exhaustive;
        return null;
      }
    }
  };

  const renderOAuthTab = () => (
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
  );

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={onClose}
    >
      <div
        ref={focusTrapRef}
        className="modal login-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 380 }}
      >
        <div className="modal-header">
          <h3 id="login-modal-title">
            <Icon name="user" size={18} /> Sign In
          </h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            x
          </button>
        </div>

        <div className="modal-body">
          <div className="auth-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === 'email'}
              className={`auth-tab ${tab === 'email' ? 'active' : ''}`}
              onClick={() => switchTab('email')}
            >
              Email
            </button>
            <button
              role="tab"
              aria-selected={tab === 'oauth'}
              className={`auth-tab ${tab === 'oauth' ? 'active' : ''}`}
              onClick={() => switchTab('oauth')}
            >
              OAuth
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {tab === 'email' ? renderEmailTab() : renderOAuthTab()}

          <p className="auth-hint">
            Sign in to sync campaigns across devices. The app works fully offline without an account.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
