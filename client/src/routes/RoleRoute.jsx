import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import BrandLoader from '../components/BrandLoader';

export default function RoleRoute({ roles }) {
  const { user, loading } = useAuth();
  const { openAuth } = useAuthModal();

  useEffect(() => {
    if (loading) return;
    if (!user) openAuth({ view: 'welcome' });
    else if (!user.emailVerified) openAuth({ view: 'verify', locked: true });
    else if (!user.onboardingCompleted) openAuth({ view: 'onboarding', locked: true });
  }, [loading, user, openAuth]);

  if (loading) return <BrandLoader label="Checking permissions" />;
  if (!user) return <Navigate to="/" replace />;
  if (!user.emailVerified || !user.onboardingCompleted) return <Navigate to="/" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
