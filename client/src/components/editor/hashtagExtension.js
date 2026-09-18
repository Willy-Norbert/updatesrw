import Mention from '@tiptap/extension-mention';
import api from '../../services/api';
import { createSuggestionRender } from './createSuggestionRender';

export const HashtagExtension = Mention.extend({
  name: 'hashtag',
  renderLabel({ options, node }) {
    return `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`;
  },
}).configure({
  HTMLAttributes: {
    class: 'hashtag',
  },
  suggestion: {
    char: '#',
    allowSpaces: false,
    items: async ({ query }) => {
      const term = String(query || '').replace(/^#/, '').trim().toLowerCase();
      try {
        if (!term) {
          const { data } = await api.get('/hashtags/trending');
          return (Array.isArray(data.data) ? data.data : []).slice(0, 8).map((tag) => ({
            ...tag,
            id: tag.name,
            label: tag.name,
          }));
        }
        const { data } = await api.get('/hashtags/search', { params: { q: term } });
        const rows = (Array.isArray(data.data) ? data.data : []).map((tag) => ({
          ...tag,
          id: tag.name,
          label: tag.name,
        }));
        if (!rows.some((tag) => tag.name === term)) {
          return [{ id: term, label: term, name: term, _count: { posts: 0 }, isNew: true }, ...rows].slice(0, 8);
        }
        return rows.slice(0, 8);
      } catch {
        return term ? [{ id: term, label: term, name: term, _count: { posts: 0 }, isNew: true }] : [];
      }
    },
    render: createSuggestionRender('hashtag'),
    command: ({ editor, range, props }) => {
      const name = String(props.name || props.label || props.id || '')
        .replace(/^#/, '')
        .toLowerCase();
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'hashtag',
            attrs: { id: name, label: name },
          },
          { type: 'text', text: ' ' },
        ])
        .run();
    },
  },
});
