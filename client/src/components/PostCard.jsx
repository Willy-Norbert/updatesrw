import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { formatDate, typeLabel, mediaUrl } from '../utilities/format';
import Avatar from './Avatar';
import LikeButton from './LikeButton';

export default function PostCard({ post }) {
  const image = (post.media || []).find((item) => item.type === 'IMAGE');
  const video = (post.media || []).find((item) => item.type === 'VIDEO');

  return (
    <article className="post-row">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={post.postType === 'ACHIEVEMENT' ? 'pill' : 'pill pill-ghost'}>{typeLabel(post.postType)}</span>
          {post.featured ? <span className="pill">Featured</span> : null}
          {post.category ? (
            <Link to={`/category/${post.category.slug}`} className="text-xs uppercase tracking-wider text-[var(--text-soft)]">
              {post.category.name}
            </Link>
          ) : null}
        </div>
        <h2>
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
        </h2>
        {post.excerpt ? <p className="m-0 text-[var(--text-soft)]">{post.excerpt}</p> : null}
        <div className="flex items-center gap-3 mt-3 text-sm text-[var(--text-soft)]">
          <Link to={`/u/${post.author?.username}`} className="flex items-center gap-2 text-[var(--text)]">
            <Avatar user={post.author} size={22} />
            {post.author?.fullName}
          </Link>
          <span>{formatDate(post.createdAt)}</span>
          <LikeButton post={post} variant="card" />
          <Link to={`/posts/${post.id}#comments`} className="inline-flex items-center gap-1">
            <MessageCircle size={14} />
            {post.commentsCount || 0} comments
          </Link>
        </div>
        {post.hashtags?.length ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.hashtags.map((tag) => (
              <Link key={tag.id || tag.name} to={`/hashtag/${tag.name}`} className="text-sm text-[#00824a]">
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {image ? (
        <Link to={`/posts/${post.id}`} className="w-[160px] max-w-full shrink-0">
          <img src={mediaUrl(image.url)} alt="" className="w-full h-[110px] object-cover" />
        </Link>
      ) : video ? (
        <Link to={`/posts/${post.id}`} className="w-[160px] text-xs uppercase tracking-wider text-[var(--text-soft)]">
          Video attached
        </Link>
      ) : null}
    </article>
  );
}
