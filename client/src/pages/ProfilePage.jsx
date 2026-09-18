import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate, roleLabel } from '../utilities/format';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import BrandLoader from '../components/BrandLoader';

const TABS = [
  ['posts', 'Posts'],
  ['achievements', 'Achievements'],
  ['experiences', 'Experiences'],
  ['likes', 'Liked'],
];

export default function ProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('posts');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${username}`).then(({ data }) => setProfile(data.data)).finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!username) return;
    const path = tab === 'posts' ? `/users/${username}/posts` : `/users/${username}/${tab}`;
    api.get(path).then(({ data }) => setItems(data.data));
  }, [username, tab]);

  if (loading || !profile) return <BrandLoader full={false} />;

  return (
    <div>
      <div className="flex gap-5 items-start mb-8">
        <Avatar user={profile} size={84} />
        <div>
          <h1 className="mt-0 mb-1">{profile.fullName}</h1>
          <p className="m-0 text-[var(--text-soft)]">@{profile.username} · {roleLabel(profile.role)}</p>
          {profile.bio ? <p className="max-w-2xl">{profile.bio}</p> : null}
          <p className="text-sm text-[var(--text-soft)]">Joined {formatDate(profile.createdAt)}</p>
          <div className="flex gap-4 text-sm">
            <span>{profile.stats?.posts || 0} posts</span>
            <span>{profile.stats?.achievements || 0} achievements</span>
            <span>{profile.stats?.experiences || 0} experiences</span>
          </div>
          {user?.username === profile.username ? <Link className="btn btn-ghost mt-3" to="/settings">Edit profile</Link> : null}
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        {TABS.map(([id, label]) => (
          <button key={id} className={`btn ${tab === id ? '' : 'btn-ghost'}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      {items.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
