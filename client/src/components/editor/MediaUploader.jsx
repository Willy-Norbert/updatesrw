import { useState } from 'react';
import api, { getErrorMessage } from '../../services/api';
import { mediaUrl } from '../../utilities/format';

export default function MediaUploader({ media, onChange }) {
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  async function upload(file, kind) {
    const form = new FormData();
    form.append(kind === 'video' ? 'video' : 'image', file);
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(kind === 'video' ? '/uploads/video' : '/uploads/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (!event.total) return;
          setProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      onChange([...media, data.data]);
    } catch (err) {
      setError(getErrorMessage(err, 'Upload failed'));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  function onFiles(event, kind) {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    files.forEach((file) => upload(file, kind));
  }

  function remove(url) {
    onChange(media.filter((item) => item.url !== url));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <label className="btn btn-ghost">
          Add images
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden multiple onChange={(event) => onFiles(event, 'image')} />
        </label>
        <label className="btn btn-ghost">
          Add video
          <input type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={(event) => onFiles(event, 'video')} />
        </label>
      </div>
      {busy ? (
        <div className="mt-3 text-sm text-[var(--text-soft)]">
          Uploading… {progress ? `${progress}%` : ''}
          <div className="h-1 mt-2 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-1 bg-[var(--accent)]" style={{ width: `${progress || 8}%` }} />
          </div>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {media.map((item) => (
          <div key={item.url} className="media-thumb relative border border-[var(--border)] overflow-hidden">
            {item.type === 'VIDEO' ? (
              <video src={mediaUrl(item.url)} className="w-full h-28 object-cover bg-black" />
            ) : (
              <img src={mediaUrl(item.url)} alt="" className="w-full h-28 object-cover" />
            )}
            <button type="button" className="btn btn-danger absolute top-1 right-1 h-7 text-xs" onClick={() => remove(item.url)}>
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
