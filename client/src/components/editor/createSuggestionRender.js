import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import SuggestionList from './SuggestionList';

export function createSuggestionRender(kind = 'mention') {
  return () => {
    let component;
    let popup;

    return {
      onStart(props) {
        component = new ReactRenderer(SuggestionList, {
          props: { ...props, kind },
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'updaterw',
          maxWidth: 'none',
          offset: [0, 8],
        });
      },

      onUpdate(props) {
        component?.updateProps({ ...props, kind });
        if (!props.clientRect || !popup?.[0]) return;
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup?.[0]?.hide();
          return true;
        }
        return component?.ref?.onKeyDown?.(props) ?? false;
      },

      onExit() {
        popup?.[0]?.destroy();
        component?.destroy();
        popup = null;
        component = null;
      },
    };
  };
}
