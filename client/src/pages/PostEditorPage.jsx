import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api';
import RichEditor from '../components/editor/RichEditor';
import MediaUploader from '../components/editor/MediaUploader';
import HashtagInput from '../components/editor/HashtagInput';
import PostContent from '../components/PostContent';
import { typeLabel } from '../utilities/format';

const TYPES = ['TEXT', 'ARTICLE', 'IMAGE', 'VIDEO', 'EXPERIENCE', 'ACHIEVEMENT'];

const empty = {
  title: '',
  content: '<p></p>',
  postType: 'TEXT',
  categoryId: '',
  hashtags: '',
  lessonsLearned: '',
  achievementDate: '',
  organization: '',
  status: 'PUBLISHED',
  media: [],
};

export default function PostEditorPage({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    api.get(`/posts/${id}`).then(({ data }) => {
      const post = data.data;
      setForm({
        title: post.title,
        content: post.content,
        postType: post.postType,
        categoryId: post.category?.id || '',
        hashtags: (post.hashtags || []).map((tag) => tag.name).join(', '),
        lessonsLearned: post.lessonsLearned || '',
        achievementDate: post.achievementDate ? String(post.achievementDate).slice(0, 10) : '',
        organization: post.organization || '',
        status: post.status,
        media: post.media || [],
      });
    });
  }, [mode, id]);

  function patch(next) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function submit(status) {
    setBusy(true);
    setError('');
    const payload = {
      title: form.title,
      content: form.content,
      postType: form.postType,
      categoryId: form.categoryId || null,
      hashtags: form.hashtags.split(/[,\s]+/).map((tag) => tag.replace(/^#/, '')).filter(Boolean),
      lessonsLearned: form.postType === 'EXPERIENCE' ? form.lessonsLearned : null,
      achievementDate: form.postType === 'ACHIEVEMENT' && form.achievementDate ? form.achievementDate : null,
      organization: form.postType === 'ACHIEVEMENT' ? form.organization : null,
      status,
      media: form.media.map((item) => ({
        url: item.url,
        type: item.type,
        publicId: item.publicId,
        mimeType: item.mimeType,
        size: item.size,
      })),
    };
    try {
      const { data } = mode === 'edit'
        ? await api.put(`/posts/${id}`, payload)
        : await api.post('/posts', payload);
      navigate(`/posts/${data.data.id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save post'));
    } finally {
      setBusy(false);
    }
  }

  const previewPost = {
    ...form,
    hashtags: form.hashtags.split(/[,\s]+/).filter(Boolean).map((name) => ({ name: name.replace(/^#/, '') })),
    category: categories.find((item) => item.id === form.categoryId),
    media: form.media,
  };

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
      <div>
        <p className="label">{mode === 'edit' ? 'Edit post' : 'Create post'}</p>
        <h1 className="mt-1">{mode === 'edit' ? 'Revise your update' : 'Publish something useful'}</h1>
        <label className="label">Title</label>
        <input className="field mb-4" value={form.title} onChange={(event) => patch({ title: event.target.value })} placeholder="A precise, useful headline" />
        <label className="label">Content</label>
        <RichEditor value={form.content} onChange={(content) => patch({ content })} />
        <div className="mt-5">
          <label className="label">Media</label>
          <MediaUploader media={form.media} onChange={(media) => patch({ media })} />
        </div>
        {form.postType === 'EXPERIENCE' ? (
          <div className="mt-5">
            <label className="label">Lessons learned</label>
            <textarea className="textarea" value={form.lessonsLearned} onChange={(event) => patch({ lessonsLearned: event.target.value })} />
          </div>
        ) : null}
        {form.postType === 'ACHIEVEMENT' ? (
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="label">Organization</label>
              <input className="field" value={form.organization} onChange={(event) => patch({ organization: event.target.value })} />
            </div>
            <div>
              <label className="label">Achievement date</label>
              <input className="field" type="date" value={form.achievementDate} onChange={(event) => patch({ achievementDate: event.target.value })} />
            </div>
          </div>
        ) : null}
        {error ? <p className="text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2 mt-6">
          <button className="btn" disabled={busy} onClick={() => submit('PUBLISHED')}>{busy ? 'Publishing…' : 'Publish'}</button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => submit('DRAFT')}>Save draft</button>
          <button className="btn btn-ghost" type="button" onClick={() => setPreview((v) => !v)}>{preview ? 'Hide preview' : 'Preview'}</button>
        </div>
        {preview ? (
          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <p className="label">Preview</p>
            <span className="pill">{typeLabel(form.postType)}</span>
            <h2>{form.title || 'Untitled'}</h2>
            <PostContent post={previewPost} />
          </div>
        ) : null}
      </div>
      <aside>
        <div className="sidebar-block" style={{ borderTop: 0, paddingTop: 0 }}>
          <h3>Post type</h3>
          <div className="grid gap-2">
            {TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input type="radio" checked={form.postType === type} onChange={() => patch({ postType: type })} />
                {typeLabel(type)}
              </label>
            ))}
          </div>
        </div>
        <div className="sidebar-block">
          <h3>Category</h3>
          <select className="field" value={form.categoryId} onChange={(event) => patch({ categoryId: event.target.value })}>
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        <div className="sidebar-block">
          <h3>Hashtags</h3>
          <HashtagInput value={form.hashtags} onChange={(hashtags) => patch({ hashtags })} />
        </div>
        <div className="sidebar-block">
          <h3>Mentions & tags</h3>
          <p className="text-sm text-[var(--text-soft)] m-0">
            In the editor, type <b>@</b> to search people and <b>#</b> to search or create hashtags — same pattern as LinkedIn and X.
          </p>
        </div>
      </aside>
    </div>
  );
}
