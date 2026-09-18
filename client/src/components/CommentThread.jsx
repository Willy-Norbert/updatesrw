import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { formatDateTime } from '../utilities/format';
import { renderPlainText } from '../utilities/content';
import Avatar from './Avatar';

function CommentItem({ comment, postId, onAdded, depth = 0 }) {
  const { user } = useAuth();
  const [reply, setReply] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submitReply(event) {
    event.preventDefault();
    const text = reply.trim();
    if (!text) {
      setError('Write a reply first.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, {
        content: text,
        parentCommentId: comment.id,
      });
      setReply('');
      setOpen(false);
      setError('');
      onAdded?.(data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add reply'));
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.patch(`/comments/${comment.id}`, { content: draft });
      setEditing(false);
      setError('');
      onAdded?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save comment'));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${comment.id}`);
      onAdded?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not delete comment'));
    }
  }

  return (
    <div className={depth ? 'ml-6 mt-4 pl-4 border-l border-[var(--border)]' : 'mt-5'}>
      <div className="flex items-center gap-2 text-sm">
        <Avatar user={comment.author} size={22} />
        <Link to={`/u/${comment.author?.username}`} className="font-semibold">
          {comment.author?.fullName}
        </Link>
        <span className="text-[var(--text-soft)]">{formatDateTime(comment.createdAt)}</span>
      </div>
      {editing ? (
        <form onSubmit={saveEdit} className="mt-2">
          <textarea className="textarea" value={draft} onChange={(event) => setDraft(event.target.value)} />
          <button className="btn mt-2" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </form>
      ) : (
        <p
          className="comment-body mt-2 mb-1"
          dangerouslySetInnerHTML={{ __html: renderPlainText(comment.content) }}
        />
      )}
      <div className="flex gap-3 text-xs uppercase tracking-wider">
        {user ? (
          <button type="button" onClick={() => setOpen((v) => !v)}>
            Reply
          </button>
        ) : null}
        {user?.id === comment.author?.id ? (
          <>
            <button type="button" onClick={() => setEditing(true)}>Edit</button>
            <button type="button" onClick={remove}>Delete</button>
          </>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {open ? (
        <form onSubmit={submitReply} className="mt-2">
          <textarea className="textarea" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply. You can mention @username." />
          <button className="btn mt-2" type="submit" disabled={busy}>{busy ? 'Posting…' : 'Reply'}</button>
        </form>
      ) : null}
      {(comment.replies || []).map((child) => (
        <CommentItem key={child.id} comment={child} postId={postId} onAdded={onAdded} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function CommentThread({ postId, comments, onChanged, onAdded }) {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleAdded(comment) {
    if (comment) onAdded?.(comment);
    else onChanged?.();
  }

  async function submit(event) {
    event.preventDefault();
    const text = content.trim();
    if (!text) {
      setError('Write a comment first.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { content: text });
      setContent('');
      setError('');
      handleAdded(data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not add comment'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10" id="comments">
      <h3 className="text-lg mt-0">Comments</h3>
      {user ? (
        <form onSubmit={submit}>
          <textarea
            className="textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Share a note, question, @mention, or https:// link."
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button className="btn mt-2" type="submit" disabled={busy}>
            {busy ? 'Posting…' : 'Comment'}
          </button>
        </form>
      ) : (
        <p className="text-[var(--text-soft)]">
          <button type="button" className="auth-text-btn" onClick={() => openAuth({ view: 'welcome' })}>Log in</button> to join the discussion.
        </p>
      )}
      {(Array.isArray(comments) ? comments : []).map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} onAdded={handleAdded} />
      ))}
    </section>
  );
}
