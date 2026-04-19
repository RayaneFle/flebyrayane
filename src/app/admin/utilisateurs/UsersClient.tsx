"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import RoleChanger from "./RoleChanger";
import DeleteUserBtn from "./DeleteUserBtn";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  avgScore: number;
  lastActivity: string | null;
  counts: { activityResults: number; enrollments: number; classroomMemberships: number; lessonProgress: number };
  classroomIds: string[];
}

interface Classroom { id: string; name: string; code: string; memberCount: number; }

export default function UsersClient({ users, isAdmin, currentUserEmail, classrooms }: { users: User[]; isAdmin: boolean; currentUserEmail: string; classrooms: Classroom[] }) {
  const [sort, setSort] = useState("recent");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== "all") result = result.filter(u => u.role === roleFilter);
    if (classFilter !== "all") result = result.filter(u => u.classroomIds.includes(classFilter));
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(u => (u.name || "").toLowerCase().includes(s) || (u.email || "").toLowerCase().includes(s));
    }
    return [...result].sort((a, b) => {
      if (sort === "recent") {
        const at = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const bt = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return bt - at;
      }
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      if (sort === "score") return b.avgScore - a.avgScore;
      return 0;
    });
  }, [users, sort, roleFilter, classFilter, search]);

  function daysSince(dateStr: string | null) {
    if (!dateStr) return null;
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "aujourd'hui";
    if (days === 1) return "hier";
    if (days < 7) return "il y a " + days + "j";
    if (days < 30) return "il y a " + Math.floor(days / 7) + " sem.";
    return "il y a " + Math.floor(days / 30) + " mois";
  }

  const inactiveCount = users.filter(u => !u.lastActivity || (Date.now() - new Date(u.lastActivity).getTime()) > 7 * 24 * 60 * 60 * 1000).length;
  const roleLabels: Record<string, string> = { student: "Élève", teacher: "Professeur", admin: "Admin" };
  const roleColors: Record<string, string> = { student: "bg-brand-100 text-brand-700", teacher: "bg-accent-100 text-accent-700", admin: "bg-purple-100 text-purple-700" };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-slate-900">{isAdmin ? "Utilisateurs" : "Mes élèves"}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {filtered.length} {isAdmin ? "utilisateur" : "élève"}{filtered.length > 1 ? "s" : ""}
          {inactiveCount > 0 && <span className="text-amber-600"> · {inactiveCount} inactif{inactiveCount > 1 ? "s" : ""}</span>}
        </p>
      </div>

      {/* Filtres compacts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-400 bg-white">
              <option value="all">👤 Tous les rôles</option>
              <option value="student">👤 Élèves</option>
              <option value="teacher">👤 Professeurs</option>
              <option value="admin">👤 Admins</option>
            </select>
          )}
          {isAdmin && classrooms.length > 0 && (
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-400 bg-white">
              <option value="all">🎓 Toutes les classes</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.memberCount})</option>
              ))}
            </select>
          )}
          <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-400 bg-white ml-auto">
            <option value="recent">↕ Activité récente</option>
            <option value="name">↕ Nom A-Z</option>
            <option value="score">↕ Meilleur score</option>
          </select>
        </div>
      </div>

      {/* Liste de cartes */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(u => {
            const ago = daysSince(u.lastActivity);
            const isInactive = u.lastActivity && (Date.now() - new Date(u.lastActivity).getTime()) > 7 * 24 * 60 * 60 * 1000;
            return (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 hover:border-brand-200 hover:shadow-sm transition-all p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Link href={"/admin/utilisateurs/" + u.id} className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                      {u.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  </Link>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={"/admin/utilisateurs/" + u.id} className="font-heading font-bold text-slate-900 hover:text-brand-700 truncate block">
                          {u.name || "—"}
                        </Link>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                      {isAdmin && <ActionMenu user={u} currentUserEmail={currentUserEmail} />}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={"text-[11px] font-semibold px-2 py-0.5 rounded-full " + (roleColors[u.role] || "bg-slate-100 text-slate-600")}>
                        {roleLabels[u.role] || u.role}
                      </span>
                      {u.counts.classroomMemberships > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          🎓 {u.counts.classroomMemberships} classe{u.counts.classroomMemberships > 1 ? "s" : ""}
                        </span>
                      )}
                      {isInactive && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Inactif
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      {u.avgScore > 0 ? (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">📊</span>
                          <span className={"font-bold " + (u.avgScore >= 80 ? "text-green-600" : u.avgScore >= 50 ? "text-amber-600" : "text-red-600")}>{u.avgScore}%</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-400">📊</span>
                          <span className="text-slate-400">—</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">📝</span>
                        <span><b className="text-slate-700">{u.counts.activityResults}</b> activité{u.counts.activityResults > 1 ? "s" : ""}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-400">📖</span>
                        <span><b className="text-slate-700">{u.counts.lessonProgress}</b> leçon{u.counts.lessonProgress > 1 ? "s" : ""}</span>
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        <span className="text-slate-400">⏰</span>
                        <span className={isInactive ? "text-amber-600 font-medium" : ""}>{ago || "jamais"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionMenu({ user, currentUserEmail }: { user: User; currentUserEmail: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Actions">
        <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20 animate-slide-down">
          <Link href={"/admin/utilisateurs/" + user.id} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <span>👁</span><span>Voir les détails</span>
          </Link>
          <div className="px-4 py-2 border-t border-slate-100 mt-1 pt-2">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Changer le rôle</p>
            <RoleChanger userId={user.id} currentRole={user.role} />
          </div>
          <div className="border-t border-slate-100 mt-1 pt-1 px-2">
            <DeleteUserBtn userId={user.id} email={user.email || ""} currentUserEmail={currentUserEmail} />
          </div>
        </div>
      )}
    </div>
  );
}
