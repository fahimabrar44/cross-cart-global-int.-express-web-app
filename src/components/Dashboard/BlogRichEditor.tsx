"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Text,
  Underline,
  Undo2,
  X,
} from "lucide-react";

interface BlogRichEditorProps {
  value: string;
  onChange: (html: string) => void;
  gallery?: string[];
}

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}

const ToolButton = ({ label, onClick, active, children }: ToolButtonProps) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`inline-flex items-center justify-center h-8 w-8 rounded transition-colors ${
      active
        ? "bg-[#12352A] text-white"
        : "text-gray-600 hover:bg-gray-200"
    }`}
  >
    {children}
  </button>
);

const BlogRichEditor = ({ value, onChange, gallery }: BlogRichEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);

  // Sync external value into the contentEditable only when it actually
  // differs from what is in the DOM. Updating innerHTML on every keystroke
  // would destroy the caret/selection and make typing feel broken.
  useEffect(() => {
    const el = editorRef.current;
    if (el && value !== el.innerHTML) {
      el.innerHTML = value;
    }
  }, [value]);

  const exec = (command: string, commandValue?: string) => {
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
    editorRef.current?.focus();
  };

  const insertImage = (url: string) => {
    if (!url) return;
    exec(
      "insertHTML",
      `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;" />`
    );
  };

  const handleLink = () => {
    const url = window.prompt("Enter link URL (https://...)");
    if (!url) return;
    exec("createLink", url);
  };

  const handleImageFromUrl = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    insertImage(url);
  };

  const handleImageButton = () => {
    if (gallery && gallery.length > 0) {
      setShowImageMenu((prev) => !prev);
    } else {
      handleImageFromUrl();
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <div className="flex flex-wrap gap-0.5 items-center bg-gray-50 border-b border-gray-200 px-2 py-1.5">
        <ToolButton label="Undo" onClick={() => exec("undo")}>
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Redo" onClick={() => exec("redo")}>
          <Redo2 className="h-4 w-4" />
        </ToolButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolButton label="Heading 2" onClick={() => exec("formatBlock", "H2")}>
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Heading 3" onClick={() => exec("formatBlock", "H3")}>
          <Heading3 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Paragraph" onClick={() => exec("formatBlock", "P")}>
          <Text className="h-4 w-4" />
        </ToolButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolButton label="Bold" onClick={() => exec("bold")}>
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Italic" onClick={() => exec("italic")}>
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Underline" onClick={() => exec("underline")}>
          <Underline className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Strikethrough" onClick={() => exec("strikeThrough")}>
          <Strikethrough className="h-4 w-4" />
        </ToolButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolButton label="Bullet List" onClick={() => exec("insertUnorderedList")}>
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Numbered List" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Quote" onClick={() => exec("formatBlock", "BLOCKQUOTE")}>
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Code" onClick={() => exec("formatBlock", "PRE")}>
          <Code className="h-4 w-4" />
        </ToolButton>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolButton label="Insert Link" onClick={handleLink}>
          <Link className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Remove Link" onClick={() => exec("unlink")}>
          <Link2Off className="h-4 w-4" />
        </ToolButton>
        <div className="relative">
          <ToolButton label="Insert Image" onClick={handleImageButton}>
            <ImageIcon className="h-4 w-4" />
          </ToolButton>
          {showImageMenu && gallery && (
            <div className="absolute left-0 top-8 z-50 w-56 rounded-md border border-gray-200 bg-white shadow-lg p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">
                  Choose image
                </span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowImageMenu(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto grid grid-cols-3 gap-1 mb-2">
                {gallery.map((imgUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    className="h-14 w-full rounded border border-gray-200 overflow-hidden hover:ring-2 hover:ring-primary"
                    onClick={() => {
                      insertImage(imgUrl);
                      setShowImageMenu(false);
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="w-full text-xs text-primary hover:underline text-left"
                onClick={() => {
                  setShowImageMenu(false);
                  handleImageFromUrl();
                }}
              >
                Insert from URL
              </button>
            </div>
          )}
        </div>
        <ToolButton label="Clear Formatting" onClick={() => exec("removeFormat")}>
          <RemoveFormatting className="h-4 w-4" />
        </ToolButton>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML || "")}
        className="min-h-[320px] max-h-[480px] overflow-y-auto p-4 prose max-w-none focus:outline-none"
        data-testid="blog-content-editor"
      />
    </div>
  );
};

export default BlogRichEditor;
