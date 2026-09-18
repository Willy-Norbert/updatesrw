import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    emailNotifications: user?.emailNotifications !== false,
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function saveProfile(event) {
    event.preventDefault();
    setError('');
    try {
      const { data } = await api.patch('/users/me', profile);
      setUser(data.data);
      setMessage('Profile updated');
      if (data.data.username !== user.username) navigate(`/u/${data.data.username}`);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError('');
    try {
      await api.patch('/users/me/password', passwords);
      setMessage('Password updated');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('image', file);
    const { data } = await api.post('/users/me/avatar', form);
    setUser(data.data);
    setMessage('Photo updated');
  }

  return (
    <div className="max-w-xl">
      <h1 className="mt-0">Settings</h1>
      <div className="flex items-center gap-4 mb-6">
        <Avatar user={user} size={72} />
        <label className="btn btn-ghost">
          Change photo
          <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={onAvatar} />
        </label>
      </div>
      {message ? <p className="text-[#00824a]">{message}</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
      <form onSubmit={saveProfile} className="grid gap-3 mb-10">
        <label className="label">Full name</label>
        <input className="field" value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} />
        <label className="label">Username</label>
        <input className="field" value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value })} />
        <label className="label">Bio</label>
        <textarea className="textarea" value={profile.bio} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profile.emailNotifications}
            onChange={(event) => setProfile({ ...profile, emailNotifications: event.target.checked })}
          />
          Email me about likes, comments, and new posts
        </label>
        <button className="btn w-fit" type="submit">Save profile</button>
      </form>
      {user?.hasPassword ? (
        <form onSubmit={savePassword} className="grid gap-3">
          <h2>Password</h2>
          <input className="field" type="password" placeholder="Current password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} />
          <input className="field" type="password" placeholder="New password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} />
          <button className="btn w-fit" type="submit">Update password</button>
        </form>
      ) : (
        <div className="grid gap-2">
          <h2>Password</h2>
          <p className="text-sm text-[var(--text-soft)]">
            You signed in with {user?.googleLinked ? 'Google' : ''}{user?.googleLinked && user?.githubLinked ? ' / ' : ''}{user?.githubLinked ? 'GitHub' : ''}{!user?.googleLinked && !user?.githubLinked ? 'a social provider' : ''}. There is no password on this account.
          </p>
        </div>
      )}
    </div>
  );
}
