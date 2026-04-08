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
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { useRef, useState } from "react";

interface Props { content: string; onChange: (html: string) => void; }

export default function TiptapEditor({ content, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, allowBase64: false }),
      Youtube.configure({ width: 640, height: 360 }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "prose max-w-none focus:outline-none min-h-[200px]" } },
  });

  if (!editor) return <div className="border border-brand-200 rounded-xl p-4 text-brand-300 text-sm">Chargement...</div>;

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const d = await res.json();
      editor?.chain().focus().setImage({ src: d.url }).run();
    } else { alert("Erreur upload."); }
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = "";
  }

  function addImageChoice() {
    const choice = confirm("OK = Importer depuis votre ordinateur\nAnnuler = Saisir une URL");
    if (choice) { fileRef.current?.click(); }
    else { const url = prompt("URL de l'image :"); if (url) editor?.chain().focus().setImage({ src: url }).run(); }
  }

  function addLink() {
    const url = prompt("URL du lien :");
    if (url) editor?.chain().focus().setLink({ href: url, target: "_blank" }).run();
  }
  function addYoutube() {
    const url = prompt("URL YouTube :");
    if (url) editor?.chain().focus().setYoutubeVideo({ src: url }).run();
  }
  function addTable() { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }

  const colors = ["#000000","#dc2626","#ea580c","#ca8a04","#16a34a","#2563eb","#7c3aed","#db2777","#6b7280"];
  const highlights = ["#fef08a","#bbf7d0","#bfdbfe","#fbcfe8","#fed7aa","#e9d5ff","transparent"];

  const B = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
    <button type="button" onClick={onClick} title={title} className={"px-2 py-1 rounded text-sm font-medium transition-colors " + (active ? "bg-brand-200 text-brand-800" : "text-brand-500 hover:bg-brand-100")}>{children}</button>
  );

  return (
    <div className="tiptap-editor border border-brand-200 rounded-xl overflow-hidden">
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <div className="flex flex-wrap gap-0.5 p-2 border-b border-brand-100 bg-brand-50/50">
        <B active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras"><b>G</b></B>
        <B active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique"><i>I</i></B>
        <B active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligne"><u>S</u></B>
        <B active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Barre"><s>B</s></B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <B active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Titre 1">H1</B>
        <B active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titre 2">H2</B>
        <B active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titre 3">H3</B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <B active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste a puces">{"\u2022"}</B>
        <B active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numerotee">1.</B>
        <B active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">{"\u275d"}</B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <B active={editor.isActive({textAlign:"left"})} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Gauche">{"\u2190"}</B>
        <B active={editor.isActive({textAlign:"center"})} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centre">{"\u2194"}</B>
        <B active={editor.isActive({textAlign:"right"})} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Droite">{"\u2192"}</B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <div className="relative">
          <B onClick={() => { setShowColors(!showColors); setShowHighlight(false); }} title="Couleur du texte"><span style={{color: editor.getAttributes("textStyle").color || "#000"}}>A</span></B>
          {showColors && <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 w-32 z-50">
            {colors.map(c => <button key={c} type="button" onClick={() => { editor.chain().focus().setColor(c).run(); setShowColors(false); }} className="w-6 h-6 rounded border border-slate-200 hover:scale-110 transition-transform" style={{backgroundColor: c}} />)}
            <button type="button" onClick={() => { editor.chain().focus().unsetColor().run(); setShowColors(false); }} className="w-full text-xs text-slate-400 mt-1 hover:text-slate-600">Defaut</button>
          </div>}
        </div>
        <div className="relative">
          <B onClick={() => { setShowHighlight(!showHighlight); setShowColors(false); }} title="Surligner">{"\ud83d\udd8d"}</B>
          {showHighlight && <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 w-32 z-50">
            {highlights.map(c => <button key={c} type="button" onClick={() => { if (c === "transparent") editor.chain().focus().unsetHighlight().run(); else editor.chain().focus().toggleHighlight({color: c}).run(); setShowHighlight(false); }} className="w-6 h-6 rounded border border-slate-200 hover:scale-110 transition-transform" style={{backgroundColor: c === "transparent" ? "#fff" : c}} >{c === "transparent" ? "\u2715" : ""}</button>)}
          </div>}
        </div>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        <B onClick={addLink} title="Lien">{"\ud83d\udd17"}</B>
        <B onClick={addImageChoice} title="Image">{uploading ? "..." : "\ud83d\uddbc\ufe0f"}</B>
        <B onClick={addYoutube} title="YouTube">{"\u25b6\ufe0f"}</B>
        <B onClick={addTable} title="Tableau">{"\ud83d\udcca"}</B>
        <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        {editor.isActive("table") && <>
          <B onClick={() => editor.chain().focus().addColumnAfter().run()} title="Colonne +">C+</B>
          <B onClick={() => editor.chain().focus().deleteColumn().run()} title="Colonne -">C-</B>
          <B onClick={() => editor.chain().focus().addRowAfter().run()} title="Ligne +">L+</B>
          <B onClick={() => editor.chain().focus().deleteRow().run()} title="Ligne -">L-</B>
          <B onClick={() => editor.chain().focus().deleteTable().run()} title="Supprimer tableau">{"\ud83d\uddd1"}</B>
          <span className="w-px h-6 bg-brand-200 mx-1 self-center" />
        </>}
        <B onClick={() => editor.chain().focus().undo().run()} title="Annuler">{"\u21a9"}</B>
        <B onClick={() => editor.chain().focus().redo().run()} title="Refaire">{"\u21aa"}</B>
      </div>
      <EditorContent editor={editor} className="p-4" />
    </div>
  );
}