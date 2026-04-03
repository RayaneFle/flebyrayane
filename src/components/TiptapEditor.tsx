"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";

interface Props { content: string; onChange: (html: string) => void; }

export default function TiptapEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit, Link.configure({ openOnClick: false }), Image, Youtube.configure({ width: 640, height: 360 }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "prose max-w-none focus:outline-none min-h-[200px]" } },
  });

  if (!editor) return <div className="border border-brand-200 rounded-xl p-4 text-brand-300 text-sm">Chargement de l&apos;éditeur…</div>;

  function addImage() {
    const url = prompt("URL de l'image :"); if (url) editor?.chain().focus().setImage({ src: url }).run();
  }
  function addLink() {
    const url = prompt("URL du lien :"); if (url) editor?.chain().focus().setLink({ href: url, target: "_blank" }).run();
  }
  function addYoutube() {
    const url = prompt("URL YouTube :"); if (url) editor?.chain().focus().setYoutubeVideo({ src: url }).run();
  }
  function addTable() { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }

  const B = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <button type="button" onClick={onClick} title={title} className={`px-2 py-1 rounded text-sm font-medium transition-colors ${active ? "bg-brand-200 text-brand-800" : "text-brand-500 hover:bg-brand-100"}`}>{children}</button>
  );

  return (
    <div className="tiptap-editor border border-brand-200 rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-brand-100 bg-brand-50/50">
        <B active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras"><b>G</b></B>
        <B active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique"><i>I</i></B>
        <B active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Barré"><s>S</s></B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <B active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Titre 1">H1</B>
        <B active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titre 2">H2</B>
        <B active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titre 3">H3</B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <B active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">• Liste</B>
        <B active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">1. Liste</B>
        <B active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">❝</B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <B onClick={addLink} title="Lien">🔗</B>
        <B onClick={addImage} title="Image">🖼️</B>
        <B onClick={addYoutube} title="YouTube">▶️</B>
        <B onClick={addTable} title="Tableau">📊</B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <B onClick={() => editor.chain().focus().undo().run()} title="Annuler">↩</B>
        <B onClick={() => editor.chain().focus().redo().run()} title="Refaire">↪</B>
      </div>
      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}
