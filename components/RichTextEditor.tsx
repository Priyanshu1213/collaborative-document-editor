'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { cn } from '@/lib/utils';
import AIAssistant from '@/components/AIAssistant';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Sparkles,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

/** Convert AI (markdown-lite) output into safe HTML for insertion. */
function aiTextToHtml(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) =>
    escape(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      closeList();
      const level = m[1].length;
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (listType !== 'ul') {
        closeList();
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      if (listType !== 'ol') {
        closeList();
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${inline(m[1])}</li>`);
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('');
}

function ToolBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-40',
        active ? 'bg-primary/12 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />;
}

export default function RichTextEditor({ content, onChange, readOnly = false }: RichTextEditorProps) {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSelection, setAiSelection] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Image.configure({
        allowBase64: true,
      }),
    ],
    content,
    editable: !readOnly,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-96 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentContent = editor.getHTML();
    if (content !== currentContent) {
      editor.commands.setContent(content, {
        emitUpdate: false,
      });
    }
  }, [content, editor]);

  if (!editor) return null;

  if (readOnly) {
    return (
      <div className="doc-prose max-w-none rounded-2xl border border-border bg-card p-6 shadow-soft">
        <EditorContent editor={editor} />
      </div>
    );
  }

  const getSelectedText = (ed: Editor) => {
    const { from, to, empty } = ed.state.selection;
    if (empty) return '';
    return ed.state.doc.textBetween(from, to, '\n').trim();
  };

  const openAI = () => {
    setAiSelection(getSelectedText(editor));
    setAiOpen(true);
  };

  const handleAIInsert = (text: string) => {
    editor.chain().focus().insertContent(aiTextToHtml(text)).run();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-border bg-card/80 p-1.5 shadow-soft backdrop-blur">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <Code className="h-4 w-4" />
        </ToolBtn>

        <Divider />

        <ToolBtn
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          title="Add Image"
        >
          <ImageIcon className="h-4 w-4" />
        </ToolBtn>

        <Divider />

        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo2 className="h-4 w-4" />
        </ToolBtn>

        {/* AI — pushed to the right */}
        <button
          type="button"
          onClick={openAI}
          title="AI Assistant"
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-3 py-1.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
        >
          <Sparkles className="h-4 w-4" />
          AI Assistant
        </button>
      </div>

      {/* Editor surface */}
      <div className="doc-prose min-h-112 max-w-none rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow focus-within:border-primary/40 focus-within:shadow-elevated">
        <EditorContent editor={editor} />
      </div>

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        selectedText={aiSelection}
        onInsert={handleAIInsert}
      />
    </div>
  );
}
