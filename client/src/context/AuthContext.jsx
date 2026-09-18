import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { setAccessToken, getAccessToken, AUTH_CLEARED_EVENT } from '../services/api';

const AuthContext = createContext(null);
const emptyAuth = {
  user: null,
  setUser: () => {},
  loading: true,
  register: async () => {},
  login: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
  isAuthenticated: false,
  isAdmin: false,
  isEditor: false,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
      return data.data;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    function onCleared() {
      setUser(null);
    }
    window.addEventListener(AUTH_CLEARED_EVENT, onCleared);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, onCleared);
  }, []);

  const applyAuth = useCallback((payload) => {
    if (!payload?.accessToken || !payload.user) {
      throw new Error('Invalid authentication response');
    }
    setAccessToken(payload.accessToken);
    setUser(payload.user);
  }, []);

  const register = useCallback(async (body) => {
    const { data } = await api.post('/auth/register', body);
    applyAuth(data.data);
    return data.data;
  }, [applyAuth]);

  const login = useCallback(async (body) => {
    const { data } = await api.post('/auth/login', body);
    applyAuth(data.data);
    return data.data;
  }, [applyAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* still clear local session */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      register,
      login,
      logout,
      refreshUser: loadMe,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'ADMIN',
      isEditor: user?.role === 'ADMIN' || user?.role === 'CHIEF_EDITOR',
    }),
    [user, loading, register, login, logout, loadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext) || emptyAuth;
}
