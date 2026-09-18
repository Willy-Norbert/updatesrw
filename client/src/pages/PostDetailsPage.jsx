import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bookmark, Flag } from 'lucide-react';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { formatDate, typeLabel } from '../utilities/format';
import BrandLoader from '../components/BrandLoader';
import Avatar from '../components/Avatar';
import PostContent from '../components/PostContent';
import CommentThread from '../components/CommentThread';
import LikeButton from '../components/LikeButton';

function insertComment(list, comment) {
  if (!comment?.parentCommentId) return [...list, comment];
  return list.map((item) => {
    if (item.id === comment.parentCommentId) {
      return { ...item, replies: [...(item.replies || []), comment] };
    }
    if (item.replies?.length) {
      return { ...item, replies: insertComment(item.replies, comment) };
    }
    return item;
  });
}

export default function PostDetailsPage() {
  const { id } = useParams();
  const { user, isEditor, isAdmin } = useAuth();
  const { openAuth } = useAuthModal();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [reason, setReason] = useState('');
  const [showReport, setShowReport] = useState(false);

  const load = useCallback(async () => {
    const postRes = await api.get(`/posts/${id}`);
    setPost(postRes.data.data);
    setError('');

    const [commentRes, likeRes] = await Promise.allSettled([
      api.get(`/posts/${id}/comments`),
      api.get(`/posts/${id}/likes`),
    ]);
    if (commentRes.status === 'fulfilled') {
      const rows = commentRes.value.data.data;
      setComments(Array.isArray(rows) ? rows : []);
    }
    if (likeRes.status === 'fulfilled') {
      const rows = likeRes.value.data.data;
      setLikes(Array.isArray(rows) ? rows : []);
    }
  }, [id]);

  useEffect(() => {
    setPost(null);
    setComments([]);
    setError('');
    load().catch((err) => setError(getErrorMessage(err, 'Post not found')));
  }, [load]);

  if (error) return <p>{error}</p>;
  if (!post) return <BrandLoader full={false} />;

  const canEdit = user && (user.id === post.author?.id || isEditor);
  const canDelete = user && (user.id === post.author?.id || isAdmin);

  async function toggleBookmark() {
    if (!user) return openAuth({ view: 'welcome', from: `/posts/${id}` });
    const next = !post.bookmarkedByMe;
    setPost((current) => ({ ...current, bookmarkedByMe: next }));
    setActionError('');
    try {
      if (next) await api.post(`/posts/${id}/bookmark`);
      else await api.delete(`/posts/${id}/bookmark`);
    } catch (err) {
      setPost((current) => ({ ...current, bookmarkedByMe: !next }));
      setActionError(getErrorMessage(err, 'Could not update bookmark'));
    }
  }

  async function remove() {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not delete post'));
    }
  }

  async function report(event) {
    event.preventDefault();
    try {
      await api.post('/reports', { targetType: 'POST', postId: id, reason });
      setShowReport(false);
      setReason('');
      setActionError('');
      alert('Report submitted');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Could not submit report'));
    }
  }

  function handleCommentAdded(comment) {
    if (!comment) {
      load().catch(() => {});
      return;
    }
    setComments((current) => insertComment(current, comment));
    setPost((current) =>
      current ? { ...current, commentsCount: (current.commentsCount || 0) + 1 } : current
    );
    load().catch(() => {});
  }

  return (
    <article className="max-w-3xl">
      <div className="flex gap-2 flex-wrap mb-3">
        <span className={post.postType === 'ACHIEVEMENT' ? 'pill' : 'pill pill-ghost'}>{typeLabel(post.postType)}</span>
        {post.featured ? <span className="pill">Featured</span> : null}
        {post.category ? <Link to={`/category/${post.category.slug}`}>{post.category.name}</Link> : null}
      </div>
      <h1 className="text-[34px] leading-tight tracking-[-0.04em] mt-0">{post.title}</h1>
      <div className="flex items-center gap-3 text-sm text-[var(--text-soft)] mb-6">
        <Link to={`/u/${post.author?.username}`} className="flex items-center gap-2 text-[var(--text)]">
          <Avatar user={post.author} size={36} />
          <span>
            <b>{post.author?.fullName}</b>
            <div>@{post.author?.username}</div>
          </span>
        </Link>
        <span>{formatDate(post.createdAt)}</span>
        {post.organization ? <span>{post.organization}</span> : null}
        {post.achievementDate ? <span>{formatDate(post.achievementDate)}</span> : null}
      </div>
      <PostContent post={post} />
      <div className="flex flex-wrap gap-2 mt-6">
        {post.hashtags?.map((tag) => (
          <Link key={tag.name} to={`/hashtag/${tag.name}`} className="pill pill-ghost">#{tag.name}</Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-8">
        <LikeButton
          post={post}
          variant="detail"
          onUpdated={(result) => {
            setPost((current) =>
              current
                ? { ...current, likedByMe: result.liked, likesCount: result.likesCount }
                : current
            );
            api.get(`/posts/${id}/likes`).then((res) => {
              const rows = res.data.data;
              setLikes(Array.isArray(rows) ? rows : []);
            }).catch(() => {});
          }}
        />
        <button type="button" className={`btn ${post.bookmarkedByMe ? '' : 'btn-ghost'}`} onClick={toggleBookmark} aria-label="Bookmark">
          <Bookmark size={16} /> Save
        </button>
        {canEdit ? <Link className="btn btn-ghost" to={`/posts/${id}/edit`}>Edit</Link> : null}
        {canDelete ? <button type="button" className="btn btn-danger" onClick={remove}>Delete</button> : null}
        {user ? (
          <button type="button" className="btn btn-ghost" onClick={() => setShowReport((v) => !v)}>
            <Flag size={16} /> Report
          </button>
        ) : null}
      </div>
      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
      {showReport ? (
        <form onSubmit={report} className="mt-4">
          <textarea className="textarea" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why should moderators review this?" />
          <button className="btn mt-2" type="submit">Submit report</button>
        </form>
      ) : null}
      {isAdmin && likes.length ? (
        <section className="mt-8">
          <h3>Likes</h3>
          {likes.map((like) => (
            <div key={like.id} className="flex items-center justify-between py-2 border-b border-[var(--border)]">
              <Link to={`/u/${like.user.username}`}>@{like.user.username}</Link>
              <button
                type="button"
                className="btn btn-danger h-8"
                onClick={async () => {
                  try {
                    await api.delete(`/admin/posts/${id}/likes/${like.user.id}`);
                    await load();
                  } catch (err) {
                    setActionError(getErrorMessage(err, 'Could not remove like'));
                  }
                }}
              >
                Remove like
              </button>
            </div>
          ))}
        </section>
      ) : null}
      <CommentThread postId={id} comments={comments} onChanged={load} onAdded={handleCommentAdded} />
    </article>
  );
}
