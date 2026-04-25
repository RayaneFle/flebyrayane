"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminFAB() {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (open && courses.length === 0) {
      fetch("/api/admin/courses").then(r => r.json()).then(data => {
        if (Array.isArray(data)) setCourses(data);
      }).catch(() => {});
    }
  }, [open, courses.length]);

  if (!pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="mb-2 bg-white border border-slate-200 shadow-xl rounded-2xl w-72 max-h-96 overflow-hidden animate-fade-in-up">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-600">Ajouter rapidement</p>
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Ajouter une leçon</p>
            {courses.length === 0 ? (
              <p className="text-xs text-slate-400 px-2 py-3 text-center">Chargement...</p>
            ) : (
              courses.map((c: any) => (
                <details key={c.id} className="mb-0.5">
                  <summary className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-brand-50 cursor-pointer text-xs font-medium text-slate-700 truncate">
                    {c.title}
                  </summary>
                  <div className="pl-4 space-y-0.5 pb-1">
                    {(c.sections || []).map((s: any) => (
                      <Link key={s.id} href={"/admin/cours/" + c.id + "/sections/" + s.id + "/lessons/new"} onClick={() => setOpen(false)}
                        className="block px-2 py-1.5 rounded text-[11px] text-slate-500 hover:bg-brand-100 hover:text-brand-700 transition-colors truncate">
                        + {s.title}
                      </Link>
                    ))}
                  </div>
                </details>
              ))
            )}
            <div className="border-t border-slate-100 mt-2 pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1">Créer</p>
              <Link href="/admin/activites/creer" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent-50 text-xs text-slate-700">
                <span className="w-5 h-5 rounded bg-accent-100 flex items-center justify-center text-[10px] font-bold text-accent-600">+</span>
                Nouvelle activité
              </Link>
              <Link href="/admin/cours/creer" onClick={() => setOpen(false)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-brand-50 text-xs text-slate-700">
                <span className="w-5 h-5 rounded bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600">+</span>
                Nouveau cours
              </Link>
            </div>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        className={"w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl font-bold transition-all " +
          (open ? "bg-slate-500 rotate-45" : "bg-gradient-to-br from-brand-500 to-accent-500 hover:shadow-xl hover:scale-105")}>
        +
      </button>
    </div>
  );
}