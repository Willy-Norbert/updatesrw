import Mention from '@tiptap/extension-mention';
import api from '../../services/api';
import { createSuggestionRender } from './createSuggestionRender';

export const MentionExtension = Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: {
    char: '@',
    allowSpaces: false,
    items: async ({ query }) => {
      try {
        const { data } = await api.get('/users/mentions', { params: { q: query || '' } });
        return (Array.isArray(data.data) ? data.data : []).slice(0, 8).map((user) => ({
          ...user,
          id: user.username,
          label: user.username,
        }));
      } catch {
        return [];
      }
    },
    render: createSuggestionRender('mention'),
    command: ({ editor, range, props }) => {
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: 'mention',
            attrs: {
              id: props.username || props.id,
              label: props.username || props.label || props.id,
            },
          },
          { type: 'text', text: ' ' },
        ])
        .run();
    },
  },
});
