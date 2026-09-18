import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';

export default function AdminCommentsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState('');

  async function load(page = 1) {
    const { data } = await api.get('/admin/comments', { params: { page, limit: 15, q } });
    setItems(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="mt-0">Comments</h1>
      <form className="flex gap-2 mb-4" onSubmit={(event) => { event.preventDefault(); load(1); }}>
        <input className="field" value={q} onChange={(event) => setQ(event.target.value)} />
        <button className="btn">Search</button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Comment</th><th>Author</th><th>Post</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((comment) => (
              <tr key={comment.id}>
                <td>{comment.content}</td>
                <td>@{comment.author?.username}</td>
                <td><Link to={`/posts/${comment.post?.id}`}>{comment.post?.title}</Link></td>
                <td className="flex gap-2">
                  <button className="btn btn-ghost h-8" onClick={async () => { await api.patch(`/admin/comments/${comment.id}/hide`, { hidden: !comment.isHidden }); load(meta?.page || 1); }}>
                    {comment.isHidden ? 'Restore' : 'Hide'}
                  </button>
                  <button className="btn btn-danger h-8" onClick={async () => { await api.delete(`/admin/comments/${comment.id}`); load(meta?.page || 1); }}>
                    Delete
                  </button>
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
