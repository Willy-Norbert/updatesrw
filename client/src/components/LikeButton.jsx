import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';

export default function LikeButton({ post, variant = 'detail', onUpdated }) {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const location = useLocation();
  const [liked, setLiked] = useState(Boolean(post?.likedByMe));
  const [count, setCount] = useState(post?.likesCount || 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLiked(Boolean(post?.likedByMe));
    setCount(post?.likesCount || 0);
  }, [post?.id, post?.likedByMe, post?.likesCount]);

  async function toggle(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      openAuth({ view: 'welcome', from: location.pathname });
      return;
    }
    if (busy || !post?.id) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((value) => Math.max(0, value + (nextLiked ? 1 : -1)));
    setError('');
    setBusy(true);
    try {
      const { data } = await (nextLiked ? api.post(`/posts/${post.id}/like`) : api.delete(`/posts/${post.id}/like`));
      const result = data.data || { liked: nextLiked, likesCount: count + (nextLiked ? 1 : -1) };
      setLiked(Boolean(result.liked));
      setCount(result.likesCount ?? 0);
      onUpdated?.(result);
    } catch (err) {
      setLiked(!nextLiked);
      setCount((value) => Math.max(0, value + (nextLiked ? -1 : 1)));
      setError(getErrorMessage(err, 'Could not update like'));
    } finally {
      setBusy(false);
    }
  }

  const detail = variant === 'detail';

  return (
    <span className={detail ? 'inline-flex flex-col items-start gap-1' : 'inline-flex items-center'}>
      <button
        type="button"
        className={detail ? `btn ${liked ? '' : 'btn-ghost'}` : `inline-flex items-center gap-1 border-0 bg-transparent p-0 h-auto cursor-pointer ${liked ? 'text-[#00824a] font-semibold' : ''}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike' : 'Like'}
      >
        <Heart size={detail ? 16 : 14} fill={liked ? 'currentColor' : 'none'} />
        {detail ? count : `${count} likes`}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
