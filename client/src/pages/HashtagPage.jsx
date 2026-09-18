import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';
import BrandLoader from '../components/BrandLoader';

export default function HashtagPage() {
  const { name } = useParams();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/hashtags/${name}`, { params: { page: meta?.page || 1, limit: 10 } })
      .then(({ data }) => {
        setPosts(data.data);
        setMeta(data.meta);
      })
      .finally(() => setLoading(false));
  }, [name]);

  function loadPage(page) {
    api.get(`/hashtags/${name}`, { params: { page, limit: 10 } }).then(({ data }) => {
      setPosts(data.data);
      setMeta(data.meta);
    });
  }

  if (loading) return <BrandLoader full={false} />;

  return (
    <div>
      <p className="label">Hashtag</p>
      <h1 className="mt-1">#{name}</h1>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      <Pagination meta={meta} onPage={loadPage} />
    </div>
  );
}
