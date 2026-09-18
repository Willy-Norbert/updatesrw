import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';
import BrandLoader from '../components/BrandLoader';

const TYPES = ['', 'ARTICLE', 'EXPERIENCE', 'ACHIEVEMENT', 'VIDEO', 'IMAGE', 'TEXT'];
const SORTS = [
  ['latest', 'Latest'],
  ['trending', 'Trending'],
  ['featured', 'Featured'],
];

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const page = Number(params.get('page') || 1);
  const type = params.get('type') || '';
  const sort = params.get('sort') || 'latest';

  useEffect(() => {
    setLoading(true);
    api.get('/posts', { params: { page, limit: 10, type: type || undefined, sort } })
      .then(({ data }) => {
        setPosts(data.data);
        setMeta(data.meta);
      })
      .finally(() => setLoading(false));
  }, [page, type, sort]);

  function update(next) {
    const current = Object.fromEntries(params.entries());
    setParams({ ...current, ...next });
  }

  return (
    <div>
      <h1 className="mt-0">Explore</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {SORTS.map(([value, label]) => (
          <button key={value} className={`btn ${sort === value ? '' : 'btn-ghost'}`} onClick={() => update({ sort: value, page: 1 })}>
            {label}
          </button>
        ))}
        {TYPES.map((value) => (
          <button key={value || 'all'} className={`btn ${type === value ? '' : 'btn-ghost'}`} onClick={() => update({ type: value, page: 1 })}>
            {value || 'All types'}
          </button>
        ))}
      </div>
      {loading ? <BrandLoader full={false} /> : posts.map((post) => <PostCard key={post.id} post={post} />)}
      <Pagination meta={meta} onPage={(next) => update({ page: next })} />
    </div>
  );
}
