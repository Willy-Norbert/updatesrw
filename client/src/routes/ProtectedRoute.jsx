import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import BrandLoader from '../components/BrandLoader';

export default function ProtectedRoute({ requireVerified = false, requireOnboardingDone = false }) {
  const { user, loading } = useAuth();
  const { openAuth } = useAuthModal();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openAuth({ view: 'welcome', from: location.pathname });
      return;
    }
    if (requireVerified && !user.emailVerified) {
      openAuth({ view: 'verify', locked: true, from: location.pathname });
      return;
    }
    if (requireOnboardingDone && user.emailVerified && !user.onboardingCompleted) {
      openAuth({ view: 'onboarding', locked: true, from: location.pathname });
    }
  }, [loading, user, requireVerified, requireOnboardingDone, location.pathname, openAuth]);

  if (loading) return <BrandLoader label="Checking session" />;
  if (!user) return <Navigate to="/" replace />;
  if (requireVerified && !user.emailVerified) return <Navigate to="/" replace />;
  if (requireOnboardingDone && user.emailVerified && !user.onboardingCompleted) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
