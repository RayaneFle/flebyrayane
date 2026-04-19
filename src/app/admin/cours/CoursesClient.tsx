"use client";
import { useState } from "react";
import Link from "next/link";
import DuplicateCourseBtn from "./DuplicateCourseBtn";
import DeleteCourseInline from "./DeleteCourseInline";
import { levelColors } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  slug: string;
  level: string;
  enrollmentCode: string | null;
  author: { id: string; name: string | null };
  sectionsCount: number;
  enrollmentsCount: number;
}

export default function CoursesClient({ myCourses, otherCourses, isAdmin, currentUserId }: { myCourses: Course[]; otherCourses: Course[]; isAdmin: boolean; currentUserId: string }) {
  const [tab, setTab] = useState<"mine" | "others">("mine");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const rawList = tab === "mine" ? myCourses : otherCourses;
  const list = rawList.filter(c => !hiddenIds.has(c.id));
  const showAuthor = tab === "others";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Cours</h1>
          <p className="text-sm text-slate-400 mt-1">{list.length} cours {tab === "mine" ? "créé" + (list.length > 1 ? "s" : "") + " par vous" : "d'autres enseignants"}</p>
        </div>
        <Link href="/admin/cours/creer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all text-sm">
          + Nouveau cours
        </Link>
      </div>

      {/* Tabs - admin only */}
      {isAdmin && (
        <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("mine")}
            className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (tab === "mine" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800")}
          >
            Mes cours <span className="text-xs text-slate-400 ml-1">({myCourses.length})</span>
          </button>
          <button
            onClick={() => setTab("others")}
            className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (tab === "others" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800")}
          >
            Autres profs <span className="text-xs text-slate-400 ml-1">({otherCourses.length})</span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="text-5xl">📖</span>
          <p className="text-slate-500 mt-4">
            {tab === "mine" ? "Vous n'avez pas encore créé de cours." : "Aucun cours d'autres enseignants."}
          </p>
          {tab === "mine" && (
            <Link href="/admin/cours/creer" className="inline-block mt-4 text-brand-600 font-semibold">
              Créer votre premier cours →
            </Link>
          )}
        </div>
      ) : (
        /* Grid de cards */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all flex flex-col overflow-hidden">
              {/* Author badge (only on 'others' tab) */}
              {showAuthor && (
                <div className="bg-gradient-to-r from-slate-50 to-brand-50/30 px-5 py-2 border-b border-slate-100">
                  <p className="text-[11px] text-slate-500">
                    Par <span className="font-semibold text-slate-700">{c.author.name || "Inconnu"}</span>
                  </p>
                </div>
              )}

              {/* Body */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Link href={"/admin/cours/" + c.id} className="font-heading font-bold text-slate-900 hover:text-brand-700 text-base leading-tight flex-1">
                    {c.title}
                  </Link>
                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 " + levelColors[c.level]}>{c.level}</span>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">📑</span>
                    <span><b className="text-slate-700">{c.sectionsCount}</b> section{c.sectionsCount > 1 ? "s" : ""}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="text-slate-400">👥</span>
                    <span><b className="text-slate-700">{c.enrollmentsCount}</b> inscrit{c.enrollmentsCount > 1 ? "s" : ""}</span>
                  </span>
                  {c.enrollmentCode ? (
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400">🔑</span>
                      <span className="font-mono bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded text-[10px]">{c.enrollmentCode}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">Accès libre</span>
                  )}
                </div>
              </div>

              {/* Actions bar */}
              <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between gap-1 bg-slate-50/50">
                <div className="flex items-center gap-1">
                  <Link href={"/admin/cours/" + c.id} className="text-xs font-semibold px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors" title="Éditer">
                    ✏️ Éditer
                  </Link>
                  <Link href={"/cours/" + c.slug} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors" title="Voir le cours">
                    👁
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  {(c.author.id === currentUserId || isAdmin) && (
                    <>
                      <DuplicateCourseBtn courseId={c.id} />
                      <DeleteCourseInline courseId={c.id} canDelete={c.author.id === currentUserId || isAdmin} onDeleted={() => setHiddenIds(prev => new Set(prev).add(c.id))} />
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
