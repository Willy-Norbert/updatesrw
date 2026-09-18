import { Link } from 'react-router-dom';

export default function Sidebar({ categories = [], hashtags = [] }) {
  return (
    <aside>
      <div className="sidebar-block" style={{ borderTop: 0, paddingTop: 0 }}>
        <h3>Technology categories</h3>
        <ul className="m-0 p-0 list-none space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link to={`/category/${category.slug}`} className="flex justify-between gap-3">
                <span>{category.name}</span>
                <span className="text-[var(--text-soft)] text-sm">{category._count?.posts ?? ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="sidebar-block">
        <h3>Popular hashtags</h3>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <Link key={tag.id || tag.name} to={`/hashtag/${tag.name}`} className="pill pill-ghost">
              #{tag.name}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
