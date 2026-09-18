import { useEffect, useState } from 'react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import BrandLoader from '../components/BrandLoader';

export default function BookmarksPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/bookmarks', { params: { page, limit: 10 } })
      .then(({ data }) => {
        setItems(data.data);
        setMeta(data.meta);
      })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <BrandLoader full={false} />;

  return (
    <div>
      <h1 className="mt-0">Bookmarks</h1>
      {items.length ? items.map((post) => <PostCard key={post.id} post={post} />) : (
        <EmptyState title="No saved posts" body="Bookmark an update from the feed or a post page." />
      )}
      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
