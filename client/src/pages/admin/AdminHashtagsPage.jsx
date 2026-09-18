import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';

export default function AdminHashtagsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState('');

  async function load(page = 1) {
    const { data } = await api.get('/admin/hashtags', { params: { page, q, limit: 20 } });
    setItems(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="mt-0">Hashtags</h1>
      <form className="flex gap-2 mb-4" onSubmit={(event) => { event.preventDefault(); load(1); }}>
        <input className="field" value={q} onChange={(event) => setQ(event.target.value)} />
        <button className="btn">Search</button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Tag</th><th>Posts</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((tag) => (
              <tr key={tag.id}>
                <td><Link to={`/hashtag/${tag.name}`}>#{tag.name}</Link></td>
                <td>{tag._count?.posts ?? 0}</td>
                <td>
                  <button className="btn btn-danger h-8" onClick={async () => { await api.delete(`/admin/hashtags/${tag.id}`); load(meta?.page || 1); }}>
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
