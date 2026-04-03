"use client";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), { ssr: false });
import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { activityTypeLabels } from "@/lib/utils";

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const sectionId = params.sectionId as string;
  const lessonId = params.lessonId as string;

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`).then(r => r.json()),
      fetch("/api/activities").then(r => r.json()),
    ]).then(([lesson, acts]) => {
      setTitle(lesson.title || "");
      setBlocks(lesson.blocks || []);
      setActivities(acts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId, sectionId, lessonId]);

  function addTextBlock() { setBlocks([...blocks, { id: "new-" + Date.now(), type: "text", content: "", activityId: null, requireScore: false, minScore: 60 }]); }
  function insertActivity(idx: number, act: any) {
    const nb = { id: "new-" + Date.now(), type: "activity", content: null, activityId: act.id, requireScore: false, minScore: 60, activity: act };
    const nb2 = [...blocks]; nb2.splice(idx + 1, 0, nb); setBlocks(nb2); setShowPicker(null);
  }
  function updateBlock(idx: number, updates: any) { const u = [...blocks]; u[idx] = { ...u[idx], ...updates }; setBlocks(u); }
  function removeBlock(idx: number) { setBlocks(blocks.filter((_, i) => i !== idx)); }
  function moveBlock(idx: number, dir: string) {
    const ni = dir === "up" ? idx - 1 : idx + 1; if (ni < 0 || ni >= blocks.length) return;
    const u = [...blocks]; [u[idx], u[ni]] = [u[ni], u[idx]]; setBlocks(u);
  }

  async function save(e: FormEvent) {
    e.preventDefault(); if (!title.trim()) { setError("Titre requis."); return; }
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, blocks: blocks.map((b, i) => ({ position: i, type: b.type, content: b.content || null, activityId: b.activityId || null, requireScore: b.requireScore || false, minScore: b.minScore || 60 })) }),
    });
    if (res.ok) { router.push(`/admin/cours/${courseId}`); router.refresh(); }
    else { setError("Erreur de sauvegarde."); }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Chargement...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-8">Modifier la lecon</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}
      <form onSubmit={save} className="space-y-6">
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <label className="block text-sm font-medium text-slate-600 mb-1">Titre *</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none text-lg font-heading" />
        </div>
        <div className="space-y-3">
          {blocks.map((block, idx) => (
            <div key={block.id || idx} className="relative">
              {block.type === "text" ? (
                <div className="bg-white rounded-2xl border border-brand-100 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-400">Bloc texte</p>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveBlock(idx, "up")} disabled={idx === 0} className="text-xs text-slate-300 hover:text-slate-600 disabled:opacity-20 p-1">▲</button>
                      <button type="button" onClick={() => moveBlock(idx, "down")} disabled={idx === blocks.length - 1} className="text-xs text-slate-300 hover:text-slate-600 disabled:opacity-20 p-1">▼</button>
                      <button type="button" onClick={() => removeBlock(idx)} className="text-xs text-red-400 hover:text-red-600 p-1 ml-2">x</button>
                    </div>
                  </div>
                  <TiptapEditor content={block.content || ""} onChange={val => updateBlock(idx, { content: val })} />
                </div>
              ) : (
                <div className="bg-brand-50 rounded-2xl border-2 border-brand-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{activityTypeLabels[block.activity?.type]?.emoji || "🎮"}</span>
                      <p className="text-sm font-bold text-slate-800">{block.activity?.title || "Activite"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveBlock(idx, "up")} disabled={idx === 0} className="text-xs text-slate-300 disabled:opacity-20 p-1">▲</button>
                      <button type="button" onClick={() => moveBlock(idx, "down")} disabled={idx === blocks.length - 1} className="text-xs text-slate-300 disabled:opacity-20 p-1">▼</button>
                      <button type="button" onClick={() => removeBlock(idx)} className="text-xs text-red-400 p-1 ml-2">x</button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                    <input type="checkbox" checked={block.requireScore} onChange={e => updateBlock(idx, { requireScore: e.target.checked })} className="accent-brand-500" />
                    Score minimum requis
                  </label>
                  {block.requireScore && <input type="number" value={block.minScore} onChange={e => updateBlock(idx, { minScore: parseInt(e.target.value) || 0 })} className="w-20 border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none mt-2" min="0" max="100" />}
                </div>
              )}
              <div className="flex justify-center mt-1">
                <button type="button" onClick={() => setShowPicker(showPicker === idx ? null : idx)} className="text-xs px-3 py-1 bg-brand-100 text-brand-700 rounded-full hover:bg-brand-200 font-medium">+ Inserer activite</button>
              </div>
              {showPicker === idx && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 mt-2 max-h-60 overflow-y-auto animate-slide-down">
                  {activities.length === 0 ? <p className="text-xs text-slate-300">Aucune activite.</p> :
                    activities.map((a: any) => (
                      <button key={a.id} type="button" onClick={() => insertActivity(idx, a)} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-brand-50 text-sm">
                        <span>{activityTypeLabels[a.type]?.emoji || "📝"}</span>
                        <span className="font-medium text-slate-700">{a.title}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={addTextBlock} className="flex-1 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-brand-400">+ Bloc texte</button>
          <button type="button" onClick={() => { addTextBlock(); setShowPicker(blocks.length); }} className="flex-1 py-3 border-2 border-dashed border-brand-200 rounded-xl text-sm font-medium text-brand-500 hover:border-brand-400">+ Activite existante</button>
          <a href="/admin/activites/creer" target="_blank" rel="noopener noreferrer" className="flex-1 py-3 border-2 border-dashed border-amber-200 rounded-xl text-sm font-medium text-amber-600 hover:border-amber-400 text-center block">+ Creer une activite</a>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 transition-all">{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
          <button type="button" onClick={() => router.back()} className="px-8 py-3 bg-slate-50 text-slate-600 font-semibold rounded-xl">Annuler</button>
        </div>
      </form>
    </div>
  );
}