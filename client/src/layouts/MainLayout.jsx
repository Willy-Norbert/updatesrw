import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div className="site-shell">
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--border)]">
        <div className="site-main py-8 text-sm text-[var(--text-soft)] flex justify-between gap-4 flex-wrap">
          <span>Updaterw — technology publishing and community.</span>
          <span>AI · tools · programming · design · builder stories</span>
        </div>
      </footer>
    </div>
  );
}
