import React, { useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { compressImage } from "../utils/imageCompression";
import { uploadImage } from "../lib/api";
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
  Link as LinkIcon,
} from "lucide-react";

// Extracted outside component to prevent recreation on every render
const ToolbarButton = ({ onClick, disabled, active, icon: Icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={`p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500 ${
      active ? "bg-gray-100 text-black font-medium" : ""
    } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
  >
    <Icon className="w-5 h-5" strokeWidth={1.5} />
  </button>
);

export default function RichTextEditor({
  content,
  onChange,
  placeholder,
  maxLength = 10000,
}) {
  const [contentLength, setContentLength] = React.useState(0);
  const [showWarning, setShowWarning] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "article-image",
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const length = html.length;
      setContentLength(length);
      setShowWarning(length > maxLength * 0.9);
      onChange(html);
    },
    editorProps: {
      attributes: {
        // Increased min-height and padding
        class:
          "prose prose-lg max-w-none focus:outline-none min-h-[600px] px-8 py-6",
      },
    },
  });

  const handleImageAdd = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Show loading state
          editor
            .chain()
            .focus()
            .insertContent("<p>Uploading image...</p>")
            .run();

          // Compress image to reduce upload size
          const compressedBase64 = await compressImage(file, 800, 0.8);

          // Convert base64 to blob for upload
          const response = await fetch(compressedBase64);
          const blob = await response.blob();
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
          });

          // Upload to server
          const imageUrl = await uploadImage(compressedFile);

          // Remove loading text and insert image with server URL
          if (editor) {
            // Remove the loading paragraph
            editor.commands.deleteNode("paragraph");

            editor.chain().focus().setImage({ src: imageUrl }).run();
            editor
              .chain()
              .focus()
              .createParagraphNear()
              .insertContent("")
              .run();
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          // Remove loading text if it exists
          editor?.commands.deleteNode("paragraph");
          alert(
            "Failed to upload image. Please try again or use a smaller image."
          );
        }
      }
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    // This outer div creates the "Box" look (Border + Rounded)
    <div className="relative flex flex-col w-full bg-white border border-gray-200 rounded-xl overflow-clip">
      {/* Sticky Toolbar 
          - top-[64px]: Matches the main header height
          - z-40: Stays on top
          - bg-white: Opaque background
      */}
      <div className="sticky top-[64px] z-40 bg-white border-b border-gray-100 px-6 py-3 flex flex-wrap gap-1 items-center">
        <ToolbarButton
          icon={Undo}
          label="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        />
        <ToolbarButton
          icon={Redo}
          label="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        />

        <div className="w-px h-5 mx-2 bg-gray-200" />

        <ToolbarButton
          icon={ImageIcon}
          label="Add Image"
          onClick={handleImageAdd}
        />
        <ToolbarButton
          icon={LinkIcon}
          label="Link"
          onClick={() => {
            const url = window.prompt("URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive("link")}
        />

        <div className="w-px h-5 mx-2 bg-gray-200" />

        <ToolbarButton
          icon={Bold}
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        />
        <ToolbarButton
          icon={Italic}
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        />
        <ToolbarButton
          icon={UnderlineIcon}
          label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
        />
        <ToolbarButton
          icon={Strikethrough}
          label="Strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        />

        <div className="w-px h-5 mx-2 bg-gray-200" />

        <ToolbarButton
          icon={List}
          label="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Ordered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        />
        <ToolbarButton
          icon={Quote}
          label="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        />

        <div className="w-px h-5 mx-2 bg-gray-200" />

        <ToolbarButton
          icon={Minus}
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
      </div>

      <div className="flex-1 bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Character Counter */}
      <div className="sticky bottom-0 z-40 flex items-center justify-between px-6 py-2 bg-white border-t border-gray-100">
        <div
          className={`text-base ${
            contentLength > maxLength
              ? "text-red-600 font-semibold"
              : showWarning
              ? "text-orange-500 font-medium"
              : "text-gray-400"
          }`}
        >
          {contentLength.toLocaleString()} / {maxLength.toLocaleString()}{" "}
          characters
          {contentLength > maxLength && " (Content too long!)"}
          {showWarning && contentLength <= maxLength && " (Approaching limit)"}
        </div>
        {contentLength > maxLength && (
          <div className="text-sm text-red-500">
            Please remove some content or images
          </div>
        )}
      </div>

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: "${placeholder || "Start writing..."}";
          color: #d1d5db;
          float: left;
          height: 0;
          pointer-events: none;
        }
        
        /* SKPORT Style Image */
        .article-image {
            display: block;
            width: 100%;
            max-width: 500px;
            height: auto;
            border-radius: 8px;
            margin: 2rem auto 0.5rem auto;
            cursor: pointer;
            transition: outline 0.2s;
        }

        .article-image.ProseMirror-selectednode {
            outline: 3px solid #60A5FA;
        }

        .ProseMirror blockquote {
            border-left: 3px solid #e5e7eb;
            padding-left: 1rem;
            color: #6b7280;
            font-style: italic;
        }
      `}</style>
    </div>
  );
}
