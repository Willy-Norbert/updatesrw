import { useEffect, useState } from 'react';
import api from '../../services/api';
import BrandLoader from '../../components/BrandLoader';

const LABELS = {
  totalUsers: 'Users',
  activeUsers: 'Active users (30d)',
  totalPosts: 'Posts',
  publishedPosts: 'Published',
  totalComments: 'Comments',
  totalLikes: 'Likes',
  totalVideos: 'Videos',
  totalReports: 'Reports',
  pendingReports: 'Pending reports',
  featuredPosts: 'Featured',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.data));
  }, []);

  if (!stats) return <BrandLoader full={false} />;

  return (
    <div>
      <h1 className="mt-0">Admin overview</h1>
      <div className="dash-grid">
        {Object.entries(LABELS).map(([key, label]) => (
          <div className="stat-tile" key={key}>
            <span className="label">{label}</span>
            <b>{stats[key] ?? 0}</b>
          </div>
        ))}
      </div>
    </div>
  );
}
