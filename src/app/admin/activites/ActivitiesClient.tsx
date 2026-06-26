"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { activityTypeLabels, levelColors } from "@/lib/utils";

interface Activity {
  id: string;
  title: string;
  type: string;
  level: string | null;
  isPublic: boolean;
  createdBy: { id: string; name: string | null };
  resultsCount: number;
}

export default function ActivitiesClient({ myActivities, otherActivities, isAdmin, currentUserId }: { myActivities: Activity[]; otherActivities: Activity[]; isAdmin: boolean; currentUserId: string }) {
  const [tab, setTab] = useState<"mine" | "others">("mine");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [publicStates, setPublicStates] = useState<Record<string, boolean>>({});

  const rawBaseList = tab === "mine" ? myActivities : otherActivities;
  const baseList = rawBaseList.filter(a => !hiddenIds.has(a.id));

  function getIsPublic(a: Activity) {
    return a.id in publicStates ? publicStates[a.id] : a.isPublic;
  }

  function handleTogglePublic(activityId: string, newValue: boolean) {
    setPublicStates(prev => ({ ...prev, [activityId]: newValue }));
  }

  const list = useMemo(() => {
    if (typeFilter === "all") return baseList;
    return baseList.filter(a => a.type === typeFilter);
  }, [baseList, typeFilter]);

  const typesWithCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of baseList) counts.set(a.type, (counts.get(a.type) || 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [baseList]);

  const showAuthor = tab === "others";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Activités</h1>
          <p className="text-sm text-slate-400 mt-1">
            {list.length} {list.length > 1 ? "activités" : "activité"}
            {typeFilter !== "all" && <span className="text-slate-500"> (filtré)</span>}
          </p>
        </div>
        <Link href="/admin/activites/creer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all text-sm">
          + Nouvelle activité
        </Link>
      </div>

      {isAdmin && (
        <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-4">
          <button onClick={() => { setTab("mine"); setTypeFilter("all"); }} className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (tab === "mine" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800")}>
            Mes activités <span className="text-xs text-slate-400 ml-1">({myActivities.length})</span>
          </button>
          <button onClick={() => { setTab("others"); setTypeFilter("all"); }} className={"px-4 py-2 rounded-lg text-sm font-semibold transition-all " + (tab === "others" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800")}>
            Autres profs <span className="text-xs text-slate-400 ml-1">({otherActivities.length})</span>
          </button>
        </div>
      )}

      {baseList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setTypeFilter("all")} className={"text-xs font-semibold px-3 py-1.5 rounded-full transition-all " + (typeFilter === "all" ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
            Tous ({baseList.length})
          </button>
          {typesWithCounts.map(([type, count]) => {
            const t = activityTypeLabels[type] || { emoji: "📝", label: type };
            return (
              <button key={type} onClick={() => setTypeFilter(type)} className={"inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all " + (typeFilter === type ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>
                <span>{t.emoji}</span>
                <span>{t.label} ({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <span className="text-5xl">🎮</span>
          <p className="text-slate-500 mt-4">
            {typeFilter !== "all" ? "Aucune activité de ce type." : tab === "mine" ? "Vous n'avez pas encore créé d'activité." : "Aucune activité d'autres enseignants."}
          </p>
          {tab === "mine" && typeFilter === "all" && (
            <Link href="/admin/activites/creer" className="inline-block mt-4 text-brand-600 font-semibold">Créer votre première activité →</Link>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(a => {
            const t = activityTypeLabels[a.type] || { emoji: "📝", label: a.type };
            const isPublic = getIsPublic(a);
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all flex flex-col">
                {showAuthor && (
                  <div className="bg-gradient-to-r from-slate-50 to-brand-50/30 px-5 py-2 border-b border-slate-100 rounded-t-2xl">
                    <p className="text-[11px] text-slate-500">Par <span className="font-semibold text-slate-700">{a.createdBy.name || "Inconnu"}</span></p>
                  </div>
                )}
                <div className="p-5 flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700">
                      <span>{t.emoji}</span><span>{t.label}</span>
                    </span>
                    {a.level && <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (levelColors[a.level] || "")}>{a.level}</span>}
                    {!isPublic && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">🔒 Masquée</span>}
                    {isPublic && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✅ Visible</span>}
                  </div>
                  <Link href={"/admin/activites/" + a.id + "/modifier"} className="font-heading font-bold text-slate-900 hover:text-brand-700 text-base leading-tight block mb-2">{a.title}</Link>
                  <p className="text-xs text-slate-500">
                    <span className="text-slate-400">🎯</span> <b className="text-slate-700">{a.resultsCount}</b> partie{a.resultsCount > 1 ? "s" : ""} jouée{a.resultsCount > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between gap-1 bg-slate-50/50 rounded-b-2xl">
                  <div className="flex items-center gap-1">
                    <Link href={"/admin/activites/" + a.id + "/modifier"} className="text-xs font-semibold px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors">✏️ Modifier</Link>
                    <Link href={"/activites/" + a.id} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors" title="Voir">👁</Link>
                  </div>
                  <ActivityActionsMenu
                    activityId={a.id}
                    isPublic={isPublic}
                    canDelete={a.createdBy.id === currentUserId || isAdmin}
                    onDeleted={() => setHiddenIds(prev => new Set(prev).add(a.id))}
                    onTogglePublic={(newValue) => handleTogglePublic(a.id, newValue)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivityActionsMenu({ activityId, isPublic, canDelete, onDeleted, onTogglePublic }: { activityId: string; isPublic: boolean; canDelete: boolean; onDeleted?: () => void; onTogglePublic?: (newValue: boolean) => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function togglePublic() {
    setLoading(true);
    setOpen(false);
    const newValue = !isPublic;
    const res = await fetch("/api/activities/" + activityId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: newValue }),
    });
    if (res.ok) onTogglePublic?.(newValue);
    else alert("Erreur lors de la mise à jour.");
    setLoading(false);
  }

  async function duplicate() {
    if (loading) return;
    if (!confirm("Dupliquer cette activité ?")) return;
    setLoading(true);
    const res = await fetch("/api/activities/" + activityId + "/duplicate", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      router.push("/admin/activites/" + data.id + "/modifier");
      router.refresh();
    } else {
      alert("Erreur lors de la duplication.");
    }
    setLoading(false);
    setOpen(false);
  }

  async function deleteActivity() {
    if (!confirm("Supprimer cette activité ? Cette action est irréversible.")) return;
    setOpen(false);
    if (onDeleted) onDeleted();
    try {
      const res = await fetch("/api/activities/" + activityId, { method: "DELETE" });
      if (!res.ok) alert("Erreur lors de la suppression. Rechargez la page.");
    } catch {
      alert("Erreur réseau. Rechargez la page.");
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Actions">
        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 animate-slide-down">
          <button onClick={togglePublic} disabled={loading} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left disabled:opacity-50">
            <span className="text-base">{isPublic ? "🙈" : "✅"}</span>
            <span>{isPublic ? "Masquer" : "Publier"}</span>
          </button>
          <button onClick={duplicate} disabled={loading} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left disabled:opacity-50">
            <span className="text-base">📋</span>
            <span>{loading ? "Duplication..." : "Dupliquer"}</span>
          </button>
          {canDelete && (
            <>
              <div className="border-t border-slate-100 my-1"></div>
              <button onClick={deleteActivity} className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                <span className="text-base">🗑</span>
                <span>Supprimer</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
