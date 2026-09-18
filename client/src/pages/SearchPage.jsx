import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';
import BrandLoader from '../components/BrandLoader';
import Avatar from '../components/Avatar';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [input, setInput] = useState(q);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInput(q);
  }, [q]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResult(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get('/search', { params: { q: term } })
        .then(({ data }) => {
          if (!cancelled) setResult(data.data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  useEffect(() => {
    const term = input.trim();
    if (term === q.trim()) return undefined;
    const timer = setTimeout(() => {
      if (term.length >= 2) setParams({ q: term });
      else if (!term) setParams({});
    }, 280);
    return () => clearTimeout(timer);
  }, [input, q, setParams]);

  return (
    <div>
      <h1 className="mt-0">Search</h1>
      <form
        className="flex gap-2 mb-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (input.trim()) setParams({ q: input.trim() });
        }}
      >
        <input
          className="field"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Cursor AI, React tips, PostgreSQL, UI design"
        />
        <button className="btn" type="submit">Search</button>
      </form>
      {loading ? <BrandLoader full={false} /> : null}
      {!loading && q.trim().length >= 2 && result ? (
        <div className="grid gap-10">
          <section>
            <h2>Posts</h2>
            {result.posts?.length ? result.posts.map((post) => <PostCard key={post.id} post={post} />) : <p className="text-[var(--text-soft)]">No matching posts.</p>}
          </section>
          <section>
            <h2>People</h2>
            <div className="grid gap-3">
              {result.users?.length ? result.users.map((person) => (
                <Link key={person.id} to={`/u/${person.username}`} className="flex items-center gap-3 py-2 border-b border-[var(--border)]">
                  <Avatar user={person} />
                  <div>
                    <b>{person.fullName}</b>
                    <div className="text-sm text-[var(--text-soft)]">@{person.username}</div>
                  </div>
                </Link>
              )) : <p className="text-[var(--text-soft)]">No matching people.</p>}
            </div>
          </section>
          <section>
            <h2>Hashtags</h2>
            <div className="flex flex-wrap gap-2">
              {result.hashtags?.length ? result.hashtags.map((tag) => (
                <Link key={tag.id} className="pill pill-ghost" to={`/hashtag/${tag.name}`}>#{tag.name}</Link>
              )) : <p className="text-[var(--text-soft)]">No matching hashtags.</p>}
            </div>
          </section>
          <section>
            <h2>Categories</h2>
            {result.categories?.length ? result.categories.map((category) => (
              <Link key={category.id} className="block py-2" to={`/category/${category.slug}`}>{category.name}</Link>
            )) : <p className="text-[var(--text-soft)]">No matching categories.</p>}
          </section>
        </div>
      ) : null}
      {!loading && q.trim().length > 0 && q.trim().length < 2 ? (
        <p className="text-[var(--text-soft)]">Type at least 2 characters to search.</p>
      ) : null}
    </div>
  );
}
