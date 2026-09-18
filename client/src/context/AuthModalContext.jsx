import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import AuthModal from '../components/auth/AuthModal';

const AuthModalContext = createContext(null);

const empty = {
  open: false,
  view: 'welcome',
  from: null,
  locked: false,
  openAuth: () => {},
  closeAuth: () => {},
  setAuthView: () => {},
};

export function AuthModalProvider({ children }) {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('welcome');
  const [from, setFrom] = useState(null);
  const [locked, setLocked] = useState(false);
  const [notice, setNotice] = useState('');
  const [emailPrefill, setEmailPrefill] = useState('');

  const openAuth = useCallback((options = {}) => {
    setView(options.view || 'welcome');
    setFrom(options.from || null);
    setLocked(Boolean(options.locked));
    setNotice(options.notice || '');
    setEmailPrefill(options.email || '');
    setOpen(true);
  }, []);

  const closeAuth = useCallback((options = {}) => {
    if (locked && !options.force) return;
    setOpen(false);
    setLocked(false);
    setNotice('');
  }, [locked]);

  const setAuthView = useCallback((next, extras = {}) => {
    setView(next);
    if (extras.notice !== undefined) setNotice(extras.notice);
    if (extras.email !== undefined) setEmailPrefill(extras.email);
    if (extras.locked !== undefined) setLocked(Boolean(extras.locked));
  }, []);

  useEffect(() => {
    const oauthError = searchParams.get('oauthError');
    if (!oauthError) return;
    openAuth({ view: 'welcome', notice: decodeURIComponent(oauthError) });
    const next = new URLSearchParams(searchParams);
    next.delete('oauthError');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, openAuth]);

  useEffect(() => {
    if (loading || !user) return;
    if (!user.emailVerified) {
      openAuth({ view: 'verify', locked: true });
      return;
    }
    if (!user.onboardingCompleted) {
      openAuth({ view: 'onboarding', locked: true });
    }
  }, [user, loading, openAuth]);

  const value = useMemo(
    () => ({
      open,
      view,
      from,
      locked,
      notice,
      emailPrefill,
      openAuth,
      closeAuth,
      setAuthView,
    }),
    [open, view, from, locked, notice, emailPrefill, openAuth, closeAuth, setAuthView]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext) || empty;
}
