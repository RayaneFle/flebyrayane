"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  courseId: string;
  sectionId: string;
  lessonId: string;
  hidden: boolean;
}

export default function LessonActionsMenu({ courseId, sectionId, lessonId, hidden: initialHidden }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(initialHidden);
  const [toggling, setToggling] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deletedRow, setDeletedRow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function toggleVisibility() {
    if (toggling) return;
    setToggling(true);
    const newHidden = !hidden;
    await fetch("/api/lessons/" + lessonId + "/visibility", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: newHidden }),
    });
    setHidden(newHidden);
    setToggling(false);
    setOpen(false);
    router.refresh();
  }

  async function deleteLesson() {
    if (!confirm("Supprimer cette leçon ?")) return;
    setOpen(false);
    // UI optimiste : on cache la row IMMEDIATEMENT via parent
    const row = ref.current?.closest("[data-lesson-row]") as HTMLElement | null;
    if (row) row.style.display = "none";
    try {
      const res = await fetch("/api/admin/courses/" + courseId + "/sections/" + sectionId + "/lessons/" + lessonId, {
        method: "DELETE",
      });
      if (!res.ok) {
        if (row) row.style.display = "";
        alert("Erreur lors de la suppression.");
      }
    } catch {
      if (row) row.style.display = "";
      alert("Erreur réseau.");
    }
  }

  return (
    <>
      <div className="relative shrink-0" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Actions"
        >
          <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 animate-slide-down">
            <Link
              href={"/admin/cours/" + courseId + "/sections/" + sectionId + "/lessons/" + lessonId + "/modifier"}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="text-base">✏️</span>
              <span>Modifier</span>
            </Link>
            <button
              onClick={() => { setDuplicateOpen(true); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left"
            >
              <span className="text-base">📋</span>
              <span>Dupliquer</span>
            </button>
            <button
              onClick={toggleVisibility}
              disabled={toggling}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left disabled:opacity-50"
            >
              <span className="text-base">{hidden ? "🔒" : "👁"}</span>
              <span>{hidden ? "Rendre visible" : "Masquer"}</span>
            </button>
            <div className="border-t border-slate-100 my-1"></div>
            <button
              onClick={deleteLesson}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
            >
              <span className="text-base">🗑</span>
              <span>Supprimer</span>
            </button>
          </div>
        )}
      </div>
      {duplicateOpen && (
        <DuplicateLessonModal
          lessonId={lessonId}
          onClose={() => setDuplicateOpen(false)}
          onSuccess={() => { setDuplicateOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}

function DuplicateLessonModal({ lessonId, onClose, onSuccess }: { lessonId: string; onClose: () => void; onSuccess: () => void }) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/admin/courses")
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : data.courses || [];
        setCourses(list);
        setLoadingCourses(false);
      })
      .catch(() => setLoadingCourses(false));
  }, []);

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const sections = selectedCourse?.sections || [];

  async function dup() {
    if (!selectedSectionId) return;
    setLoading(true);
    const res = await fetch("/api/lessons/" + lessonId + "/duplicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetSectionId: selectedSectionId }),
    });
    if (res.ok) {
      setDone(true);
      setTimeout(() => onSuccess(), 1200);
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-heading font-bold text-lg text-slate-900">📋 Dupliquer la leçon</h3>
          <p className="text-xs text-slate-500 mt-1">Choisissez où copier cette leçon.</p>
        </div>
        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <span className="text-4xl">✅</span>
              <p className="text-green-600 font-semibold mt-2">Leçon dupliquée !</p>
            </div>
          ) : loadingCourses ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">Chargement des cours...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cours de destination</label>
                <select
                  value={selectedCourseId}
                  onChange={e => { setSelectedCourseId(e.target.value); setSelectedSectionId(""); }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white"
                >
                  <option value="">-- Choisir un cours --</option>
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title} {c.level ? "(" + c.level + ")" : ""}</option>
                  ))}
                </select>
              </div>
              {selectedCourseId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Section de destination</label>
                  {sections.length === 0 ? (
                    <p className="text-sm text-slate-400 italic py-2">Ce cours n'a pas de section.</p>
                  ) : (
                    <select
                      value={selectedSectionId}
                      onChange={e => setSelectedSectionId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-400 bg-white"
                    >
                      <option value="">-- Choisir une section --</option>
                      {sections.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {!done && (
          <div className="border-t border-slate-100 px-6 py-3 flex justify-end gap-2 bg-slate-50/50">
            <button onClick={onClose} className="text-sm px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button
              onClick={dup}
              disabled={!selectedSectionId || loading}
              className="text-sm px-5 py-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 transition-all"
            >
              {loading ? "Duplication…" : "Dupliquer ici"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
