import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';
import BrandLoader from '../components/BrandLoader';

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/categories/${slug}`),
      api.get('/posts', { params: { category: slug, page, limit: 10 } }),
    ]).then(([cat, feed]) => {
      setCategory(cat.data.data);
      setPosts(feed.data.data);
      setMeta(feed.data.meta);
    }).finally(() => setLoading(false));
  }, [slug, page]);

  if (loading) return <BrandLoader full={false} />;
  if (!category) return <p>Category not found.</p>;

  return (
    <div>
      <p className="label">Category</p>
      <h1 className="mt-1">{category.name}</h1>
      <p className="text-[var(--text-soft)]">{category.description}</p>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
