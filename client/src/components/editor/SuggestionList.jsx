import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import Avatar from '../Avatar';

const SuggestionList = forwardRef(function SuggestionList({ items = [], command, kind = 'mention' }, ref) {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    setSelected(0);
  }, [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (event.key === 'ArrowUp') {
        setSelected((index) => (index + items.length - 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelected((index) => (index + 1) % Math.max(items.length, 1));
        return true;
      }
      if (event.key === 'Enter') {
        const item = items[selected];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="suggestion-menu">
        <div className="suggestion-empty">
          {kind === 'hashtag' ? 'No matching hashtags' : 'No matching people'}
        </div>
      </div>
    );
  }

  return (
    <div className="suggestion-menu" role="listbox">
      {items.map((item, index) => {
        const active = index === selected;
        if (kind === 'hashtag') {
          return (
            <button
              key={item.id || item.name}
              type="button"
              role="option"
              aria-selected={active}
              className={`suggestion-item${active ? ' is-active' : ''}`}
              onMouseEnter={() => setSelected(index)}
              onClick={() => command(item)}
            >
              <span className="suggestion-hash">#</span>
              <span>
                <b>{item.isNew ? `Create #${item.name}` : `#${item.name}`}</b>
                <span className="suggestion-meta">
                  {item.isNew ? 'New hashtag' : `${item._count?.posts ?? item.postCount ?? 0} posts`}
                </span>
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={active}
            className={`suggestion-item${active ? ' is-active' : ''}`}
            onMouseEnter={() => setSelected(index)}
            onClick={() => command(item)}
          >
            <Avatar user={item} size={28} />
            <span>
              <b>{item.fullName}</b>
              <span className="suggestion-meta">@{item.username}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
});

export default SuggestionList;
