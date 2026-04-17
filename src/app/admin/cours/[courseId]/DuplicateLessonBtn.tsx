"use client";
import { useState, useEffect } from "react";

export default function DuplicateLessonBtn({ lessonId, currentCourseId }: { lessonId: string; currentCourseId: string }) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [sel, setSel] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open && courses.length === 0) {
      fetch("/api/admin/courses").then(r => r.json()).then(data => {
        setCourses(Array.isArray(data) ? data : data.courses || []);
      }).catch(() => {});
    }
  }, [open]);

  async function dup() {
    if (!sel) return;
    setLoading(true);
    const res = await fetch("/api/lessons/" + lessonId + "/duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetSectionId: sel }),
    });
    if (res.ok) { setDone(true); setTimeout(() => { setDone(false); setOpen(false); }, 1500); }
    setLoading(false);
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">Copier</button>
  );

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-heading font-bold text-lg mb-4">Copier la lecon vers...</h3>
        {done ? (
          <div className="text-center py-4"><p className="text-green-600 font-medium">Lecon copiee !</p></div>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {courses.map((c: any) => (
                <div key={c.id}>
                  <p className="text-xs font-bold text-slate-500 mb-1">{c.title} ({c.level})</p>
                  {(c.sections || []).map((s: any) => (
                    <label key={s.id} className={"flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm " + (sel === s.id ? "bg-brand-50 text-brand-700 font-medium" : "hover:bg-slate-50")}>
                      <input type="radio" name="section" value={s.id} checked={sel === s.id} onChange={() => setSel(s.id)} className="accent-brand-500" />
                      {s.title}
                    </label>
                  ))}
                </div>
              ))}
              {courses.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Chargement...</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={dup} disabled={!sel || loading} className="flex-1 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{loading ? "Copie..." : "Copier ici"}</button>
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-500 text-sm rounded-lg">Annuler</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
