import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function DashLayout({ variant = 'admin' }) {
  const { isAdmin } = useAuth();
  const adminLinks = [
    ['/admin', 'Overview'],
    ['/admin/users', 'Users'],
    ['/admin/posts', 'Posts'],
    ['/admin/comments', 'Comments'],
    ['/admin/reports', 'Reports'],
    ['/admin/categories', 'Categories'],
    ['/admin/hashtags', 'Hashtags'],
    ['/admin/emails', 'Emails'],
    ['/admin/moderation', 'Moderation'],
  ];
  const editorLinks = [
    ['/editor', 'Desk'],
    ['/editor/posts', 'Posts'],
    ['/editor/featured', 'Featured'],
    ['/editor/reports', 'Reports'],
    ['/editor/categories', 'Categories'],
    ['/editor/emails', 'Emails'],
  ];
  const links = variant === 'admin' ? adminLinks : editorLinks;

  return (
    <div className="site-shell">
      <Navbar />
      <div className="site-main grid md:grid-cols-[200px_1fr] gap-8">
        <aside className="border-r border-[var(--border)] pr-4">
          <div className="label">{variant === 'admin' ? 'Admin' : 'Chief Editor'}</div>
          <nav className="flex md:flex-col gap-2 overflow-auto">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/admin' || to === '/editor'}
                className={({ isActive }) => `px-2 py-2 text-sm ${isActive ? 'text-[#00824a] font-semibold' : ''}`}
              >
                {label}
              </NavLink>
            ))}
            {variant === 'admin' && isAdmin ? (
              <NavLink to="/editor" className="px-2 py-2 text-sm">
                Editor desk
              </NavLink>
            ) : null}
          </nav>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
