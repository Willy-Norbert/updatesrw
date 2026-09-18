import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDateTime } from '../utilities/format';
import BrandLoader from '../components/BrandLoader';
import EmptyState from '../components/EmptyState';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  async function load() {
    const { data } = await api.get('/notifications');
    setItems(data.data);
    setUnread(data.meta?.unreadCount || 0);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <BrandLoader full={false} />;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="mt-0">Notifications {unread ? `(${unread} unread)` : ''}</h1>
        <button className="btn btn-ghost" onClick={async () => { await api.post('/notifications/read-all'); load(); }}>
          Mark all read
        </button>
      </div>
      {items.length ? items.map((item) => (
        <button
          key={item.id}
          className="block w-full text-left py-4 border-b border-[var(--border)]"
          onClick={async () => {
            if (!item.isRead) await api.post(`/notifications/${item.id}/read`);
          }}
        >
          <div className="flex justify-between gap-3">
            <p className="m-0">
              {item.post ? <Link to={`/posts/${item.post.id}`}>{item.message}</Link> : item.message}
            </p>
            {!item.isRead ? <span className="pill">New</span> : null}
          </div>
          <div className="text-sm text-[var(--text-soft)]">{formatDateTime(item.createdAt)}</div>
        </button>
      )) : <EmptyState title="No notifications yet" body="Mentions, comments, likes, and moderation events will appear here." />}
    </div>
  );
}
