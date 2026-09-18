import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import Pagination from '../../components/Pagination';

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  async function load(nextPage = page) {
    try {
      const { data } = await api.get('/admin/users', { params: { page: nextPage, limit: 15, q: q || undefined } });
      setItems(data.data || []);
      setMeta(data.meta);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeRole(id, role) {
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function toggleActive(user) {
    try {
      await api.patch(`/admin/users/${user.id}/active`, { isActive: !user.isActive });
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div>
      <h1 className="mt-0">Users</h1>
      <form className="flex gap-2 mb-4" onSubmit={(event) => { event.preventDefault(); load(1); setPage(1); }}>
        <input className="field" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search users" />
        <button className="btn">Search</button>
      </form>
      {error ? <p className="text-red-600">{error}</p> : null}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((user) => (
              <tr key={user.id}>
                <td>@{user.username}<div>{user.fullName}</div></td>
                <td>{user.email}</td>
                <td>
                  <select className="field h-9" value={user.role} onChange={(event) => changeRole(user.id, event.target.value)}>
                    <option value="USER">USER</option>
                    <option value="CHIEF_EDITOR">CHIEF_EDITOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
                <td>{user.isActive ? 'Active' : 'Deactivated'}</td>
                <td>
                  <button className="btn btn-ghost h-8" onClick={() => toggleActive(user)}>
                    {user.isActive ? 'Deactivate' : 'Restore'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} onPage={(next) => { setPage(next); load(next); }} />
    </div>
  );
}
