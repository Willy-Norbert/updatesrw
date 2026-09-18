import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import BrandLoader from '../components/BrandLoader';

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      const [feed, featuredRes, cats, tags] = await Promise.all([
        api.get('/posts', { params: { page, limit: 10, sort: 'latest' } }),
        api.get('/posts', { params: { sort: 'featured', limit: 4 } }),
        api.get('/categories'),
        api.get('/hashtags/trending'),
      ]);
      if (ignore) return;
      setPosts(feed.data.data);
      setMeta(feed.data.meta);
      setFeatured(featuredRes.data.data);
      setCategories(cats.data.data);
      setHashtags(tags.data.data);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
    return () => {
      ignore = true;
    };
  }, [page]);

  if (loading && page === 1) return <BrandLoader full={false} />;

  return (
    <div className="home-grid grid grid-cols-[minmax(0,1fr)_280px] gap-10">
      <div>
        <p className="label mb-2">Technology publication</p>
        <h1 className="text-[32px] leading-tight tracking-[-0.04em] mt-0 mb-2">What builders are shipping and learning</h1>
        <p className="text-[var(--text-soft)] mt-0 mb-8 max-w-2xl">
          Short technical notes, AI tool discoveries, UI/UX lessons, and career stories — written by people who actually use the stack.
        </p>
        {featured.length ? (
          <section className="mb-8">
            <h2 className="text-sm uppercase tracking-[0.14em] text-[var(--text-soft)]">Featured</h2>
            {featured.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        ) : null}
        <h2 className="text-sm uppercase tracking-[0.14em] text-[var(--text-soft)]">Latest</h2>
        {posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : (
          <EmptyState
            title="No posts yet"
            body="The feed is connected to PostgreSQL. Publish the first update, experience, or achievement."
            action={<Link className="btn" to="/write">Write a post</Link>}
          />
        )}
        <Pagination meta={meta} onPage={setPage} />
      </div>
      <Sidebar categories={categories} hashtags={hashtags} />
    </div>
  );
}
