"use client";
import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
const LEVELS = ["A1","A2","B1","B2","C1","C2"];
export default function CreerCoursPage() {
  const router = useRouter();
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [level, setLevel] = useState("A1");
  const [requireCode, setRequireCode] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");

  useEffect(() => {
    fetch("/api/classrooms").then(r => r.json()).then(setClassrooms).catch(() => {});
  }, []);
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
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <a href="/admin/cours" className="hover:text-brand-600 transition-colors">Mes cours</a>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">Nouveau cours</span>
      </div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Créer un cours</h1>
        <p className="text-sm text-slate-500 mt-1">Définis les informations principales. Tu pourras ajouter des sections et des leçons ensuite.</p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-brand-100 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Titre *</label><input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Description *</label><textarea required value={desc} onChange={e=>setDesc(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none" /></div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Niveau CECRL</label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map(l => (
                <button key={l} type="button" onClick={() => setLevel(l)} className={"px-4 py-2 rounded-xl font-bold text-sm transition-all " + (level === l ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-md" : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200")}>{l}</button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 p-4 bg-brand-50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={requireCode} onChange={e=>setRequireCode(e.target.checked)} className="accent-brand-500 w-5 h-5" />
            <div><p className="font-medium text-slate-800 text-sm">🔒 Cours protégé par un code</p><p className="text-xs text-slate-400">Un code sera généré. Les élèves le saisiront pour s&apos;inscrire.</p></div>
          </label>
          {classrooms.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Assigner à une classe (optionnel)</label>
              <select value={selectedClassroom} onChange={e => setSelectedClassroom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none">
                <option value="">Aucune classe</option>
                {classrooms.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 transition-all inline-flex items-center gap-2">
            {loading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {loading ? "Création..." : "Créer le cours"}
          </button>
          <a href="/admin/cours" className="px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Annuler</a>
        </div>
      </form>
    </div>
  );
}
