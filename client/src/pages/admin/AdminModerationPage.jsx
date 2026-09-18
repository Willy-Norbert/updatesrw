import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminModerationPage() {
  const { isAdmin } = useAuth();
  const [postId, setPostId] = useState('');
  const [likes, setLikes] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get('/admin/reports', { params: { status: 'PENDING', limit: 8 } }).then(({ data }) => setReports(data.data));
  }, []);

  async function loadLikes(event) {
    event.preventDefault();
    const { data } = await api.get(`/posts/${postId}/likes`);
    setLikes(data.data);
  }

  return (
    <div>
      <h1 className="mt-0">Moderation</h1>
      <p className="text-[var(--text-soft)]">Review reports, hide content, and remove abusive likes.</p>
      <h2>Open reports</h2>
      {reports.map((report) => (
        <div key={report.id} className="py-3 border-b border-[var(--border)]">
          <b>{report.targetType}</b> — {report.reason}
          {report.post ? <div><Link to={`/posts/${report.post.id}`}>{report.post.title}</Link></div> : null}
        </div>
      ))}
      {isAdmin ? (
        <section className="mt-8">
          <h2>Remove a like</h2>
          <form className="flex gap-2 mb-4" onSubmit={loadLikes}>
            <input className="field" value={postId} onChange={(event) => setPostId(event.target.value)} placeholder="Post ID" />
            <button className="btn">Load likes</button>
          </form>
          {likes.map((like) => (
            <div key={like.id} className="flex justify-between py-2 border-b border-[var(--border)]">
              <span>@{like.user.username}</span>
              <button
                className="btn btn-danger h-8"
                onClick={async () => {
                  await api.delete(`/admin/posts/${postId}/likes/${like.user.id}`);
                  const { data } = await api.get(`/posts/${postId}/likes`);
                  setLikes(data.data);
                }}
              >
                Remove like
              </button>
            </div>
          ))}
        </section>
      ) : (
        <p>Like removal is an Admin-only action.</p>
      )}
    </div>
  );
}
