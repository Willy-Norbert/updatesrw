import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';

export default function AdminPostsPage({ featuredOnly = false }) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState('');

  async function load(page = 1) {
    const { data } = await api.get('/admin/posts', { params: { page, limit: 12, q, featured: featuredOnly ? true : undefined } });
    setItems(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load(); }, [featuredOnly]);

  async function feature(post, featured) {
    await api.patch(`/admin/posts/${post.id}/feature`, { featured });
    load(meta?.page || 1);
  }

  async function hide(post, hidden) {
    await api.patch(`/admin/posts/${post.id}/hide`, { hidden });
    load(meta?.page || 1);
  }

  async function remove(post) {
    if (!window.confirm('Delete this post permanently?')) return;
    await api.delete(`/admin/posts/${post.id}`);
    load(meta?.page || 1);
  }

  return (
    <div>
      <h1 className="mt-0">{featuredOnly ? 'Featured posts' : 'Posts'}</h1>
      <form className="flex gap-2 mb-4" onSubmit={(event) => { event.preventDefault(); load(1); }}>
        <input className="field" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search posts" />
        <button className="btn">Search</button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Title</th><th>Author</th><th>Status</th><th>Likes</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((post) => (
              <tr key={post.id}>
                <td><Link to={`/posts/${post.id}`}>{post.title}</Link></td>
                <td>@{post.author?.username}</td>
                <td>{post.status}{post.featured ? ' · featured' : ''}</td>
                <td>{post._count?.likes ?? 0}</td>
                <td className="flex flex-wrap gap-2">
                  <button className="btn btn-ghost h-8" onClick={() => feature(post, !post.featured)}>{post.featured ? 'Unfeature' : 'Feature'}</button>
                  <button className="btn btn-ghost h-8" onClick={() => hide(post, post.status !== 'HIDDEN')}>{post.status === 'HIDDEN' ? 'Restore' : 'Hide'}</button>
                  {isAdmin ? <button className="btn btn-danger h-8" onClick={() => remove(post)}>Delete</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} onPage={load} />
    </div>
  );
}
