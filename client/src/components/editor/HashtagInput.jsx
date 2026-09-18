import { useEffect, useRef, useState } from 'react';
import { Hash, X } from 'lucide-react';
import api from '../../services/api';

function parseTags(value) {
  return [...new Set(
    String(value || '')
      .split(/[,\s]+/)
      .map((tag) => tag.replace(/^#/, '').trim().toLowerCase())
      .filter(Boolean)
  )];
}

export default function HashtagInput({ value, onChange }) {
  const tags = parseTags(value);
  const [draft, setDraft] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    function onPointer(event) {
      if (!wrapRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, []);

  useEffect(() => {
    const term = draft.replace(/^#/, '').trim();
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { data } = term
          ? await api.get('/hashtags/search', { params: { q: term } })
          : await api.get('/hashtags/trending');
        if (cancelled) return;
        const rows = Array.isArray(data.data) ? data.data : [];
        setSuggestions(rows.filter((tag) => !tags.includes(tag.name)).slice(0, 8));
        setSelected(0);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft, tags.join(',')]);

  function commit(name) {
    const next = name.replace(/^#/, '').trim().toLowerCase();
    if (!next) return;
    if (!tags.includes(next)) onChange([...tags, next].join(', '));
    setDraft('');
    setOpen(false);
  }

  function remove(name) {
    onChange(tags.filter((tag) => tag !== name).join(', '));
  }

  function onKeyDown(event) {
    if (event.key === 'ArrowDown' && suggestions.length) {
      event.preventDefault();
      setSelected((index) => (index + 1) % suggestions.length);
      return;
    }
    if (event.key === 'ArrowUp' && suggestions.length) {
      event.preventDefault();
      setSelected((index) => (index + suggestions.length - 1) % suggestions.length);
      return;
    }
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      event.preventDefault();
      if (open && suggestions[selected]) commit(suggestions[selected].name);
      else commit(draft);
      return;
    }
    if (event.key === 'Backspace' && !draft && tags.length) {
      remove(tags[tags.length - 1]);
    }
  }

  return (
    <div className="hashtag-input" ref={wrapRef}>
      <div className="hashtag-chips">
        {tags.map((tag) => (
          <span key={tag} className="hashtag-chip">
            #{tag}
            <button type="button" aria-label={`Remove ${tag}`} onClick={() => remove(tag)}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={tags.length ? 'Add another…' : 'Search or create tags'}
        />
      </div>
      {open ? (
        <div className="hashtag-suggest">
          {draft.trim() && !suggestions.some((tag) => tag.name === draft.replace(/^#/, '').trim().toLowerCase()) ? (
            <button type="button" className="suggestion-item" onClick={() => commit(draft)}>
              <span className="suggestion-hash">#</span>
              <span>
                <b>Create #{draft.replace(/^#/, '').trim().toLowerCase()}</b>
              </span>
            </button>
          ) : null}
          {suggestions.map((tag, index) => (
            <button
              key={tag.id || tag.name}
              type="button"
              className={`suggestion-item${index === selected ? ' is-active' : ''}`}
              onMouseEnter={() => setSelected(index)}
              onClick={() => commit(tag.name)}
            >
              <span className="suggestion-hash"><Hash size={14} /></span>
              <span>
                <b>#{tag.name}</b>
                <span className="suggestion-meta">{tag._count?.posts ?? tag.postCount ?? 0} posts</span>
              </span>
            </button>
          ))}
          {!draft.trim() && !suggestions.length ? (
            <div className="suggestion-empty">Start typing to find hashtags</div>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs text-[var(--text-soft)] mt-2 mb-0">Tags from the editor (#…) are also saved automatically.</p>
    </div>
  );
}
