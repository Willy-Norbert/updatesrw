import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function EditorDashboardPage() {
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/posts', { params: { limit: 6 } }),
      api.get('/admin/reports', { params: { status: 'PENDING', limit: 6 } }),
    ]).then(([postRes, reportRes]) => {
      setPosts(postRes.data.data);
      setReports(reportRes.data.data);
    });
  }, []);

  return (
    <div>
      <h1 className="mt-0">Editor desk</h1>
      <p className="text-[var(--text-soft)]">Feature work, hide noise, manage categories, and review reports. User administration stays with Admin.</p>
      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <section>
          <h2>Recent posts</h2>
          {posts.map((post) => (
            <div key={post.id} className="py-2 border-b border-[var(--border)]">{post.title}</div>
          ))}
        </section>
        <section>
          <h2>Pending reports</h2>
          {reports.map((report) => (
            <div key={report.id} className="py-2 border-b border-[var(--border)]">{report.reason}</div>
          ))}
        </section>
      </div>
    </div>
  );
}
