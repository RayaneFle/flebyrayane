"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  courseId: string;
  initial: { title: string; description: string; level: string; published: boolean; requiresEnrollment: boolean };
}

export default function EditCourseForm({ courseId, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [level, setLevel] = useState(initial.level);
  const [published, setPublished] = useState(initial.published);
  const [requiresEnrollment, setRequiresEnrollment] = useState(initial.requiresEnrollment);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok"|"err"; text: string }|null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    const res = await fetch("/api/admin/courses/" + courseId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, level, published, requiresEnrollment }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ type: "err", text: data.message || "Erreur" });
      setLoading(false);
      return;
    }
    setMsg({ type: "ok", text: "Informations mises à jour !" });
    setLoading(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
        ✏️ Modifier les infos du cours
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-slate-800">Modifier le cours</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600" aria-label="Fermer">✕</button>
      </div>
      {msg && <div className={"text-sm px-3 py-2 rounded-lg " + (msg.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200")}>{msg.text}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Titre</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} maxLength={200} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
          <textarea required value={description} onChange={e => setDescription(e.target.value)} maxLength={2000} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Niveau</label>
            <select value={level} onChange={e => setLevel(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-400 bg-white">
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="w-4 h-4" />
            <span>Cours publié (visible)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={requiresEnrollment} onChange={e => setRequiresEnrollment(e.target.checked)} className="w-4 h-4" />
            <span>Nécessite un code d'inscription</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setOpen(false)} className="text-sm px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">Annuler</button>
          <button type="submit" disabled={loading} className="text-sm px-4 py-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 transition-all">
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
