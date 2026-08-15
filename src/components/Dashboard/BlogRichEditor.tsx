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
      active ? "bg-[#12352A] text-white" : "text-gray-600 hover:bg-gray-200"
    }`}
  >
    {children}
  </button>
);

const BLOCK_TAGS = [
  "p",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "li",
];

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

  const placeCaretAtEnd = (el: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    el.focus();
  };

  // Find the top-level block element under the caret/selection.
  const getTopLevelBlock = (): HTMLElement | null => {
    const editable = editorRef.current;
    const sel = window.getSelection();
    if (!editable || !sel || sel.rangeCount === 0) return null;

    let node: Node | null = sel.getRangeAt(0).startContainer;
    if (node.nodeType !== Node.ELEMENT_NODE) node = node.parentElement;
    let el = node as HTMLElement | null;

    while (el && el !== editable && el.parentElement !== editable) {
      el = el.parentElement;
    }
    return el && el !== editable ? el : null;
  };

  // Manual formatBlock - document.execCommand("formatBlock") is unreliable
  // in Chrome, so we replace the block element directly.
  const formatBlock = (tag: string) => {
    const editable = editorRef.current;
    if (!editable) return;

    let block = getTopLevelBlock();
    if (!block) {
      const el = document.createElement(tag);
      el.innerHTML = "<br>";
      editable.appendChild(el);
      placeCaretAtEnd(el);
      onChange(editable.innerHTML);
      return;
    }
    if (block.tagName.toLowerCase() === tag) return;
    if (BLOCK_TAGS.includes(block.tagName.toLowerCase())) {
      const newEl = document.createElement(tag);
      newEl.innerHTML = block.innerHTML;
      block.replaceWith(newEl);
      block = newEl;
    }
    placeCaretAtEnd(block);
    onChange(editable.innerHTML);
  };

  // Manual list toggle - converts the selected block(s) to a bullet/numbered
  // list, or unwraps back to paragraphs when already in the same list type.
  const toggleList = (type: "ul" | "ol") => {
    const editable = editorRef.current;
    if (!editable) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const block = getTopLevelBlock();
    const existingList = block?.closest("ul,ol");

    // Unwrap if already in a list of the same type
    if (existingList && existingList.tagName.toLowerCase() === type) {
      Array.from(existingList.children).forEach((li) => {
        const p = document.createElement("p");
        p.innerHTML = (li as HTMLElement).innerHTML;
        existingList.before(p);
      });
      existingList.remove();
      onChange(editable.innerHTML);
      return;
    }

    // Collect top-level blocks intersecting the selection
    const blocks = Array.from(editable.children).filter((child) =>
      range.intersectsNode(child)
    ) as HTMLElement[];
    const targets = blocks.length > 0 ? blocks : block ? [block] : [];

    if (targets.length === 0) {
      const list = document.createElement(type);
      const li = document.createElement("li");
      li.innerHTML = "<br>";
      list.appendChild(li);
      editable.appendChild(list);
      placeCaretAtEnd(li);
      onChange(editable.innerHTML);
      return;
    }

    const list = document.createElement(type);
    targets.forEach((t) => {
      const li = document.createElement("li");
      li.innerHTML = t.innerHTML;
      list.appendChild(li);
    });
    targets[0].replaceWith(list);
    targets.slice(1).forEach((t) => t.remove());
    const lastLi = list.querySelector("li:last-child");
    placeCaretAtEnd((lastLi as HTMLElement) || list);
    onChange(editable.innerHTML);
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

  // Enter creates a <p> block instead of the browser default <div>, which
  // renders cleanly on the public blog page (Tailwind `prose` styles <p>).
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertParagraph", false);
      onChange(editorRef.current?.innerHTML || "");
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
        <ToolButton label="Heading 2" onClick={() => formatBlock("h2")}>
          <Heading2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Heading 3" onClick={() => formatBlock("h3")}>
          <Heading3 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Paragraph" onClick={() => formatBlock("p")}>
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
        <ToolButton label="Bullet List" onClick={() => toggleList("ul")}>
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Numbered List" onClick={() => toggleList("ol")}>
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Quote" onClick={() => formatBlock("blockquote")}>
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Code" onClick={() => formatBlock("pre")}>
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
        onKeyDown={handleKeyDown}
        className="min-h-[320px] max-h-[480px] overflow-y-auto p-4 prose max-w-none focus:outline-none"
        data-testid="blog-content-editor"
      />
    </div>
  );
};

export default BlogRichEditor;
