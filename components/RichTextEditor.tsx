'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading2,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

export default function RichTextEditor({ content, onChange, readOnly = false }: RichTextEditorProps) {
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
      <div className="prose prose-invert max-w-none">
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted p-2">
        {/* Text Formatting */}
        <Button
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
          className="gap-2"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
          className="gap-2"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('underline') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
          className="gap-2"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div className="mx-1 h-6 border-l border-border" />

        {/* Headings */}
        <Button
          variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading"
          className="gap-2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        {/* Lists */}
        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
          className="gap-2"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
          className="gap-2"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        {/* Block Formatting */}
        <Button
          variant={editor.isActive('blockquote') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
          className="gap-2"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className="gap-2"
        >
          <Code className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div className="mx-1 h-6 border-l border-border" />

        {/* Links and Media */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const url = prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          title="Add Link"
          className="gap-2"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const url = prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          title="Add Image"
          className="gap-2"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div className="mx-1 h-6 border-l border-border" />

        {/* Undo/Redo */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
          className="gap-2"
        >
          <Undo2 className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
          className="gap-2"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="prose prose-invert min-h-96 max-w-none rounded-lg border border-border bg-background p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
