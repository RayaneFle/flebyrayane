"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
const LEVELS = ["A1","A2","B1","B2","C1","C2"];
export default function CreerCoursPage() {
  const router = useRouter();
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [level, setLevel] = useState("A1");
  const [requireCode, setRequireCode] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");

  useState(() => {
    fetch("/api/classrooms").then(r => r.json()).then(setClassrooms).catch(() => {});
  });
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string|null>(null);
  async function onSubmit(e: FormEvent) {
    e.preventDefault(); if (!title||!desc) { setError("Titre et description requis."); return; }
    setLoading(true); setError(null);
    const res = await fetch("/api/admin/courses", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title, description:desc, level, requiresEnrollment:requireCode }) });
    if (!res.ok) { const d = await res.json().catch(()=>({})); setError(d.message||"Erreur"); setLoading(false); return; }
    const course = await res.json();
    if (selectedClassroom) {
      await fetch(`/api/classrooms/${selectedClassroom}/courses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: course.id }) });
    }
    router.push(`/admin/cours/${course.id}`); router.refresh();
  }
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-8">Créer un cours</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-brand-100 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Titre *</label><input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Description *</label><textarea required value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Niveau</label><select value={level} onChange={e=>setLevel(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none">{LEVELS.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
          <label className="flex items-center gap-3 p-4 bg-brand-50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={requireCode} onChange={e=>setRequireCode(e.target.checked)} className="accent-brand-500 w-5 h-5" />
            <div><p className="font-medium text-slate-800 text-sm">🔒 Cours protégé par un code</p><p className="text-xs text-slate-400">Un code sera généré. Les élèves le saisiront pour s&apos;inscrire.</p></div>
          </label>
          {classrooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Assigner a une classe (optionnel)</label>
              <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none">
                <option value="">Aucune classe</option>
                {classrooms.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 transition-all">{loading?"Création…":"📖 Créer"}</button>
      </form>
    </div>
  );
}
