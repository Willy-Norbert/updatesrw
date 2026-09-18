import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import BrandLoader from '../components/BrandLoader';

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();
  const { openAuth } = useAuthModal();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = params.get('accessToken');
    if (!token) {
      setError('Missing access token from provider.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setAccessToken(token);
        const user = await refreshUser();
        if (cancelled) return;
        if (!user) {
          setError('Could not load your account.');
          return;
        }
        setUser(user);
        navigate('/', { replace: true });
      } catch {
        if (!cancelled) setError('OAuth login failed. Try again.');
      }
    })();

    return () => { cancelled = true; };
  }, [params, navigate, refreshUser, setUser]);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="mt-0">Sign-in failed</h1>
          <p className="text-red-600">{error}</p>
          <button
            type="button"
            className="btn mt-4"
            onClick={() => {
              openAuth({ view: 'welcome', notice: error });
              navigate('/', { replace: true });
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return <BrandLoader label="Finishing sign-in" />;
}
