import { renderContent } from '../utilities/content';
import { mediaUrl } from '../utilities/format';

export default function PostContent({ post }) {
  const images = (post.media || []).filter((item) => item.type === 'IMAGE');
  const videos = (post.media || []).filter((item) => item.type === 'VIDEO');

  return (
    <div>
      <div className="prose-content" dangerouslySetInnerHTML={{ __html: renderContent(post.content) }} />
      {post.lessonsLearned ? (
        <div className="mt-6 p-4 border-l-[3px] border-[var(--accent)] bg-[var(--surface)] rounded-[8px]">
          <div className="label mb-2">Lessons learned</div>
          <p className="m-0 whitespace-pre-wrap">{post.lessonsLearned}</p>
        </div>
      ) : null}
      {images.length ? (
        <div className={`mt-6 grid gap-3 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.map((item) => (
            <img key={item.id || item.url} src={mediaUrl(item.url)} alt="" className="w-full object-cover" />
          ))}
        </div>
      ) : null}
      {videos.map((item) => (
        <video key={item.id || item.url} src={mediaUrl(item.url)} controls className="mt-6 w-full bg-black" />
      ))}
    </div>
  );
}
