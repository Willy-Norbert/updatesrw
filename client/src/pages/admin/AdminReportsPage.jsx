import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';

const STATUSES = ['PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED'];

export default function AdminReportsPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState('PENDING');

  async function load(page = 1) {
    const { data } = await api.get('/admin/reports', { params: { page, limit: 12, status } });
    setItems(data.data);
    setMeta(data.meta);
  }

  useEffect(() => { load(); }, [status]);

  return (
    <div>
      <h1 className="mt-0">Reports</h1>
      <div className="flex gap-2 mb-4">
        {STATUSES.map((value) => (
          <button key={value} className={`btn ${status === value ? '' : 'btn-ghost'}`} onClick={() => setStatus(value)}>{value}</button>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr><th>Target</th><th>Reason</th><th>Reporter</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((report) => (
              <tr key={report.id}>
                <td>
                  {report.targetType}{' '}
                  {report.post ? <Link to={`/posts/${report.post.id}`}>{report.post.title}</Link> : report.comment?.content}
                </td>
                <td>{report.reason}</td>
                <td>@{report.reporter?.username}</td>
                <td>
                  <select className="field h-9" value={report.status} onChange={async (event) => {
                    await api.patch(`/admin/reports/${report.id}`, { status: event.target.value });
                    load(meta?.page || 1);
                  }}>
                    {STATUSES.map((value) => <option key={value}>{value}</option>)}
                  </select>
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
