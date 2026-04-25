"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  classroomId: string;
  classroomName: string;
}

export default function ClassroomActionsMenu({ classroomId, classroomName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function deleteClassroom() {
    if (loading) return;
    if (confirmInput.trim() !== classroomName.trim()) {
      alert("Le nom ne correspond pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/classrooms/" + classroomId, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/classes");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Erreur lors de la suppression.");
        setLoading(false);
      }
    } catch {
      alert("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen(!open)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Actions">
          <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 animate-slide-down">
            <button
              onClick={() => { setConfirmOpen(true); setOpen(false); setConfirmInput(""); }}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
            >
              <span className="text-base">🗑</span>
              <span>Supprimer la classe</span>
            </button>
          </div>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !loading && setConfirmOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-heading font-bold text-lg text-red-600">⚠️ Supprimer la classe</h3>
              <p className="text-xs text-slate-500 mt-1">Cette action est irréversible. Tous les élèves, cours assignés, activités, sous-classes et publications seront retirés de cette classe.</p>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-700">Pour confirmer, tapez le nom exact de la classe :</p>
              <p className="font-mono font-bold text-sm bg-slate-100 px-3 py-2 rounded-lg">{classroomName}</p>
              <input
                type="text"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                placeholder="Tapez le nom de la classe"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400"
                disabled={loading}
              />
            </div>
            <div className="border-t border-slate-100 px-6 py-3 flex justify-end gap-2 bg-slate-50/50">
              <button onClick={() => setConfirmOpen(false)} disabled={loading} className="text-sm px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                Annuler
              </button>
              <button
                onClick={deleteClassroom}
                disabled={loading || confirmInput.trim() !== classroomName.trim()}
                className="text-sm px-5 py-2 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
