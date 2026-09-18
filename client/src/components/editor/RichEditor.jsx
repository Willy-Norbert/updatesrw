import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { MentionExtension } from './mentionExtension';
import { HashtagExtension } from './hashtagExtension';

function Tool({ editor, action, active, disabled, label, children }) {
  return (
    <button
      type="button"
      className={active ? 'is-active' : ''}
      onClick={(event) => {
        event.preventDefault();
        action?.();
      }}
      disabled={!editor || disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="editor-divider" aria-hidden="true" />;
}

export default function RichEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write the update, tip, or story… Use @ to mention and # for hashtags.',
      }),
      CharacterCount,
      MentionExtension,
      HashtagExtension,
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'editor-content prose-content',
        spellCheck: 'true',
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  useEffect(() => {
    if (!editor || value === undefined) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return <div className="editor-shell min-h-[320px]" />;

  function setLink() {
    const previous = editor.getAttributes('link').href || '';
    const href = window.prompt('Paste a link URL', previous);
    if (href === null) return;
    if (href === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  const words = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="editor-shell">
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <Tool editor={editor} label="Undo" action={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 size={15} />
        </Tool>
        <Tool editor={editor} label="Redo" action={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 size={15} />
        </Tool>
        <Divider />
        <Tool editor={editor} label="Paragraph" active={editor.isActive('paragraph') && !editor.isActive('heading')} action={() => editor.chain().focus().setParagraph().run()}>
          <Pilcrow size={15} />
        </Tool>
        <Tool editor={editor} label="Heading 2" active={editor.isActive('heading', { level: 2 })} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={15} />
        </Tool>
        <Tool editor={editor} label="Heading 3" active={editor.isActive('heading', { level: 3 })} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={15} />
        </Tool>
        <Divider />
        <Tool editor={editor} label="Bold" active={editor.isActive('bold')} action={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </Tool>
        <Tool editor={editor} label="Italic" active={editor.isActive('italic')} action={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </Tool>
        <Tool editor={editor} label="Underline" active={editor.isActive('underline')} action={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={15} />
        </Tool>
        <Tool editor={editor} label="Strikethrough" active={editor.isActive('strike')} action={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough size={15} />
        </Tool>
        <Tool editor={editor} label="Highlight" active={editor.isActive('highlight')} action={() => editor.chain().focus().toggleHighlight().run()}>
          <Highlighter size={15} />
        </Tool>
        <Divider />
        <Tool editor={editor} label="Align left" active={editor.isActive({ textAlign: 'left' })} action={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft size={15} />
        </Tool>
        <Tool editor={editor} label="Align center" active={editor.isActive({ textAlign: 'center' })} action={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter size={15} />
        </Tool>
        <Tool editor={editor} label="Align right" active={editor.isActive({ textAlign: 'right' })} action={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight size={15} />
        </Tool>
        <Divider />
        <Tool editor={editor} label="Bullet list" active={editor.isActive('bulletList')} action={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </Tool>
        <Tool editor={editor} label="Numbered list" active={editor.isActive('orderedList')} action={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </Tool>
        <Tool editor={editor} label="Quote" active={editor.isActive('blockquote')} action={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={15} />
        </Tool>
        <Tool editor={editor} label="Inline code" active={editor.isActive('code')} action={() => editor.chain().focus().toggleCode().run()}>
          <Code size={15} />
        </Tool>
        <Tool editor={editor} label="Code block" active={editor.isActive('codeBlock')} action={() => editor.chain().focus().toggleCodeBlock().run()}>
          <SquareCode size={15} />
        </Tool>
        <Tool editor={editor} label="Divider" action={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={15} />
        </Tool>
        <Divider />
        <Tool editor={editor} label="Insert link" active={editor.isActive('link')} action={setLink}>
          <Link2 size={15} />
        </Tool>
        <Tool editor={editor} label="Clear formatting" action={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <RemoveFormatting size={15} />
        </Tool>
      </div>
      <EditorContent editor={editor} />
      <div className="editor-footer">
        <span>Type <b>@</b> to mention · <b>#</b> for hashtags</span>
        <span>{words} words · {chars} characters</span>
      </div>
    </div>
  );
}
