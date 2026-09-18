import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminCategoriesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });

  async function load() {
    const { data } = await api.get('/categories');
    setItems(data.data);
  }

  useEffect(() => { load(); }, []);

  async function create(event) {
    event.preventDefault();
    await api.post('/admin/categories', form);
    setForm({ name: '', description: '' });
    load();
  }

  return (
    <div>
      <h1 className="mt-0">Categories</h1>
      <form className="flex flex-wrap gap-2 mb-6" onSubmit={create}>
        <input className="field max-w-xs" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="field max-w-sm" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <button className="btn">Add</button>
      </form>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Name</th><th>Slug</th><th>Posts</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.slug}</td>
                <td>{category._count?.posts ?? 0}</td>
                <td>
                  <button className="btn btn-danger h-8" onClick={async () => { await api.delete(`/admin/categories/${category.id}`); load(); }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
