import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { GithubIcon, GoogleIcon } from '../icons/BrandIcons';

const STEPS = [
  {
    title: 'Welcome to Updaterw',
    body: 'A publishing space for builders — AI notes, tools, programming tips, and career stories.',
  },
  {
    title: 'Publish useful work',
    body: 'Write posts with mentions, hashtags, media, and lessons learned.',
  },
  {
    title: 'Stay in the loop',
    body: 'Get email when people engage with your posts, and when new updates are published.',
  },
];

export default function AuthModal() {
  const {
    open,
    view,
    from,
    locked,
    notice,
    emailPrefill,
    closeAuth,
    setAuthView,
  } = useAuthModal();
  const { login, register, setUser, user } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState({ google: false, github: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ email: '', code: '', password: '' });
  const [verifyCode, setVerifyCode] = useState('');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [bio, setBio] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (!open) return;
    setError('');
    setMessage(notice || '');
    api.get('/auth/oauth/providers')
      .then(({ data }) => setProviders(data.data || { google: false, github: false }))
      .catch(() => setProviders({ google: false, github: false }));
  }, [open, notice]);

  useEffect(() => {
    if (emailPrefill) {
      setForgotEmail(emailPrefill);
      setResetForm((current) => ({ ...current, email: emailPrefill }));
      setRegisterForm((current) => ({ ...current, email: emailPrefill }));
    }
  }, [emailPrefill]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape' && !locked) closeAuth();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, locked, closeAuth]);

  if (!open) return null;

  function finishAuth(data) {
    if (data?.requiresEmailVerification || data?.requiresOnboarding) {
      // AuthModalProvider opens verify/onboarding from the updated user.
      return;
    }
    closeAuth({ force: true });
    if (from) navigate(from);
  }

  async function submitLogin(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await login(loginForm);
      finishAuth(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not log in'));
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await register(registerForm);
      finishAuth(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create account'));
    } finally {
      setBusy(false);
    }
  }

  async function submitForgot(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      setMessage(data.message || 'If that email exists, a reset code was sent.');
      setAuthView('reset', { email: forgotEmail, notice: data.message });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send reset code'));
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/reset-password', resetForm);
      setAuthView('login', { notice: 'Password updated. Log in with your new password.' });
      setLoginForm((current) => ({ ...current, identifier: resetForm.email }));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reset password'));
    } finally {
      setBusy(false);
    }
  }

  async function submitVerify(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-email', { code: verifyCode });
      setUser(data.data);
      if (data.data.onboardingCompleted) {
        closeAuth({ force: true });
        if (from) navigate(from);
        else navigate('/');
      }
      // else AuthModalProvider opens onboarding
    } catch (err) {
      setError(getErrorMessage(err, 'Could not verify email'));
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/resend-verification');
      setMessage('A new code was sent to your inbox.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not resend code'));
    } finally {
      setBusy(false);
    }
  }

  async function finishOnboarding() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/onboarding', { bio, emailNotifications });
      setUser(data.data);
      closeAuth({ force: true });
      navigate(from || '/');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not finish onboarding'));
    } finally {
      setBusy(false);
    }
  }

  const title = {
    welcome: 'Sign in to Updaterw',
    login: 'Log in with email',
    register: 'Create your account',
    forgot: 'Reset password',
    reset: 'Enter reset code',
    verify: 'Verify your email',
    onboarding: STEPS[onboardingStep]?.title || 'Getting started',
  }[view];

  return (
    <div className="auth-modal-root" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={closeAuth} disabled={locked} />
      <div className="auth-modal-panel">
        <div className="auth-modal-top">
          <div>
            <p className="auth-modal-kicker">Updaterw</p>
            <h2 className="auth-modal-title">{title}</h2>
          </div>
          {!locked ? (
            <button type="button" className="icon-btn" onClick={closeAuth} aria-label="Close">
              <X size={18} />
            </button>
          ) : null}
        </div>

        {message ? <p className="auth-modal-notice">{message}</p> : null}
        {error ? <p className="auth-modal-error">{error}</p> : null}

        {view === 'welcome' ? (
          <div className="auth-modal-stack">
            <p className="auth-modal-copy">Continue with Google or GitHub, or use your email.</p>
            {providers.google ? (
              <a className="btn btn-ghost auth-social-btn" href="/api/auth/google">
                <GoogleIcon />
                Continue with Google
              </a>
            ) : null}
            {providers.github ? (
              <a className="btn btn-ghost auth-social-btn" href="/api/auth/github">
                <GithubIcon />
                Continue with GitHub
              </a>
            ) : null}
            {!providers.google && !providers.github ? (
              <p className="text-sm text-[var(--text-soft)]">Social sign-in will appear once Google/GitHub keys are added.</p>
            ) : null}
            <div className="auth-modal-divider"><span>or</span></div>
            <button type="button" className="btn btn-ghost w-full" onClick={() => setAuthView('login')}>
              Continue with email
            </button>
            <p className="auth-modal-foot">
              New here?{' '}
              <button type="button" className="auth-text-btn" onClick={() => setAuthView('register')}>
                Create an account
              </button>
            </p>
          </div>
        ) : null}

        {view === 'login' ? (
          <form className="auth-modal-stack" onSubmit={submitLogin}>
            <label className="label">Email or username</label>
            <input className="field" value={loginForm.identifier} onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })} autoComplete="username" />
            <label className="label">Password</label>
            <input className="field" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} autoComplete="current-password" />
            <button type="button" className="auth-text-btn text-sm self-start" onClick={() => setAuthView('forgot')}>
              Forgot password?
            </button>
            <button className="btn w-full" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
            <button type="button" className="btn btn-ghost w-full" onClick={() => setAuthView('welcome')}>Back</button>
            <p className="auth-modal-foot">
              No account?{' '}
              <button type="button" className="auth-text-btn" onClick={() => setAuthView('register')}>Register</button>
            </p>
          </form>
        ) : null}

        {view === 'register' ? (
          <form className="auth-modal-stack" onSubmit={submitRegister}>
            <div className="auth-modal-social-row">
              {providers.google ? (
                <a className="btn btn-ghost flex-1" href="/api/auth/google">
                  <GoogleIcon />
                  Google
                </a>
              ) : null}
              {providers.github ? (
                <a className="btn btn-ghost flex-1" href="/api/auth/github">
                  <GithubIcon />
                  GitHub
                </a>
              ) : null}
            </div>
            {(providers.google || providers.github) ? <div className="auth-modal-divider"><span>or email</span></div> : null}
            <label className="label">Full name</label>
            <input className="field" value={registerForm.fullName} onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })} />
            <label className="label">Username</label>
            <input className="field" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} autoComplete="username" />
            <label className="label">Email</label>
            <input className="field" type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} autoComplete="email" />
            <label className="label">Password</label>
            <input className="field" type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} autoComplete="new-password" />
            <p className="text-xs text-[var(--text-soft)]">At least 8 characters, with a letter and a number.</p>
            <button className="btn w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
            <button type="button" className="btn btn-ghost w-full" onClick={() => setAuthView('welcome')}>Back</button>
          </form>
        ) : null}

        {view === 'forgot' ? (
          <form className="auth-modal-stack" onSubmit={submitForgot}>
            <p className="auth-modal-copy">Enter your email and we’ll send a one-time code.</p>
            <label className="label">Email</label>
            <input className="field" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
            <button className="btn w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset code'}</button>
            <button type="button" className="btn btn-ghost w-full" onClick={() => setAuthView('login')}>Back to login</button>
          </form>
        ) : null}

        {view === 'reset' ? (
          <form className="auth-modal-stack" onSubmit={submitReset}>
            <label className="label">Email</label>
            <input className="field" type="email" value={resetForm.email} onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })} />
            <label className="label">OTP code</label>
            <input className="field tracking-[0.3em] text-center" value={resetForm.code} onChange={(e) => setResetForm({ ...resetForm, code: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="000000" />
            <label className="label">New password</label>
            <input className="field" type="password" value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} />
            <button className="btn w-full" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button>
            <button type="button" className="btn btn-ghost w-full" onClick={() => setAuthView('forgot')}>Request a new code</button>
          </form>
        ) : null}

        {view === 'verify' ? (
          <form className="auth-modal-stack" onSubmit={submitVerify}>
            <p className="auth-modal-copy">We sent a 6-digit code to <b>{user?.email}</b>.</p>
            <label className="label">Verification code</label>
            <input className="field tracking-[0.3em] text-center text-lg" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" inputMode="numeric" />
            <button className="btn w-full" disabled={busy || verifyCode.length !== 6}>{busy ? 'Verifying…' : 'Verify email'}</button>
            <button type="button" className="btn btn-ghost w-full" disabled={busy} onClick={resendCode}>Resend code</button>
          </form>
        ) : null}

        {view === 'onboarding' ? (
          <div className="auth-modal-stack">
            <p className="label">Getting started · {onboardingStep + 1}/{STEPS.length}</p>
            <p className="auth-modal-copy">{STEPS[onboardingStep].body}</p>
            {onboardingStep === STEPS.length - 1 ? (
              <>
                <label className="label">Short bio (optional)</label>
                <textarea className="textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What do you build or write about?" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
                  Email me about likes, comments, and new posts
                </label>
              </>
            ) : null}
            <div className="flex gap-2">
              {onboardingStep > 0 ? (
                <button type="button" className="btn btn-ghost" onClick={() => setOnboardingStep((v) => v - 1)}>Back</button>
              ) : null}
              {onboardingStep < STEPS.length - 1 ? (
                <button type="button" className="btn flex-1" onClick={() => setOnboardingStep((v) => v + 1)}>Continue</button>
              ) : (
                <button type="button" className="btn flex-1" disabled={busy} onClick={finishOnboarding}>
                  {busy ? 'Saving…' : 'Enter Updaterw'}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
