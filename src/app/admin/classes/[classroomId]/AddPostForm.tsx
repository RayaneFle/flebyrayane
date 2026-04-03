"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddPostForm({ classroomId }: { classroomId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("text");
  const [title, setTitle] = useState(""); const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState(""); const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    let fileUrl = ""; let fileName = "";
    if (file) {
      const fd = new FormData(); fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      if (uploadRes.ok) { const d = await uploadRes.json(); fileUrl = d.url; fileName = file.name; }
    }
    await fetch(`/api/classrooms/${classroomId}/posts`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, content, videoUrl: videoUrl || null, fileUrl: fileUrl || null, fileName: fileName || null }),
    });
    setOpen(false); setTitle(""); setContent(""); setVideoUrl(""); setFile(null); setLoading(false);
    router.refresh();
  }

  if (!open) return <button onClick={() => setOpen(true)} className="w-full py-3 border-2 border-dashed border-brand-200 rounded-xl text-sm font-medium text-slate-400 hover:border-brand-400 hover:text-brand-600 transition-colors">+ Publier du contenu</button>;

  return (
    <div className="p-4 bg-brand-50 rounded-xl space-y-3">
      <div className="flex gap-2">
        {["text","video","pdf","link"].map(t => (
          <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${type === t ? "bg-brand-500 text-white" : "bg-white text-slate-500 hover:bg-brand-100"}`}>
            {t === "text" ? "📝 Texte" : t === "video" ? "🎬 Vidéo" : t === "pdf" ? "📄 Fichier" : "🔗 Lien"}
          </button>
        ))}
      </div>
      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Titre" />
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Description…" />
      {type === "video" && <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="URL YouTube (ex: https://youtube.com/watch?v=...)" />}
      {type === "pdf" && <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />}
      {type === "link" && <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="URL du lien" />}
      <div className="flex gap-2">
        <button onClick={submit} disabled={loading} className="px-5 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50">{loading ? "Publication…" : "Publier"}</button>
        <button onClick={() => setOpen(false)} className="px-5 py-2 bg-slate-100 text-slate-500 text-sm rounded-lg">Annuler</button>
      </div>
    </div>
  );
}
