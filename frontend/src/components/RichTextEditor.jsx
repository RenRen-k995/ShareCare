import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import {
  Undo,
  Redo,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
} from 'lucide-react';

export default function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for simplicity
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Underline,
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] max-w-none',
      },
    },
  });

  const handleImageAdd = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          if (editor) {
            editor.chain().focus().setImage({ src: base64String }).run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return null;
  }

  const toolbarButtons = [
    { icon: Undo, label: 'Undo', action: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
    { icon: Redo, label: 'Redo', action: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
    { icon: ImageIcon, label: 'Image', action: handleImageAdd },
    { icon: Bold, label: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: Italic, label: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: UnderlineIcon, label: 'Underline', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
    { icon: Strikethrough, label: 'Strike', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
    { icon: List, label: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { icon: ListOrdered, label: 'Ordered List', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { icon: Quote, label: 'Blockquote', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
    { icon: Minus, label: 'Horizontal Rule', action: () => editor.chain().focus().setHorizontalRule().run() },
  ];

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 py-4 border-b border-gray-200">
        {toolbarButtons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              type="button"
              title={button.label}
              onClick={button.action}
              disabled={button.disabled}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                button.active ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
              } ${button.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Editor Content */}
      <div className="mt-4">
        <EditorContent editor={editor} />
      </div>

      {/* Custom CSS for editor and image selection */}
      <style>{`
        .ProseMirror {
          padding: 0.5rem 0;
          outline: none;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1rem auto;
          border-radius: 0.5rem;
          cursor: pointer;
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .ProseMirror ul {
          list-style-type: disc;
        }

        .ProseMirror ol {
          list-style-type: decimal;
        }

        .ProseMirror li {
          margin: 0.25rem 0;
        }

        .ProseMirror blockquote {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }

        .ProseMirror hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 2rem 0;
        }

        .ProseMirror strong {
          font-weight: 700;
        }

        .ProseMirror em {
          font-style: italic;
        }

        .ProseMirror u {
          text-decoration: underline;
        }

        .ProseMirror s {
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
