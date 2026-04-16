"use client";
import { useState, useMemo } from "react";
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
}

export default function UsersClient({ users, isAdmin, currentUserEmail }: { users: User[]; isAdmin: boolean; currentUserEmail: string }) {
  const [sort, setSort] = useState("recent");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter) result = result.filter(u => u.role === roleFilter);
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
      if (sort === "activities") return b.counts.activityResults - a.counts.activityResults;
      if (sort === "lessons") return b.counts.lessonProgress - a.counts.lessonProgress;
      if (sort === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
  }, [users, sort, roleFilter, search]);

  function daysSince(dateStr: string | null) {
    if (!dateStr) return null;
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd hui";
    if (days === 1) return "Hier";
    if (days < 7) return "Il y a " + days + " jours";
    if (days < 30) return "Il y a " + Math.floor(days / 7) + " sem.";
    return "Il y a " + Math.floor(days / 30) + " mois";
  }

  const inactiveCount = users.filter(u => !u.lastActivity || (Date.now() - new Date(u.lastActivity).getTime()) > 7 * 24 * 60 * 60 * 1000).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-sm text-slate-400">{filtered.length} utilisateur{filtered.length > 1 ? "s" : ""} {inactiveCount > 0 && " - " + inactiveCount + " inactif" + (inactiveCount > 1 ? "s" : "") + " (>7j)"}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Trier par :</span>
          <Pill active={sort === "recent"} onClick={() => setSort("recent")}>Activite recente</Pill>
          <Pill active={sort === "name"} onClick={() => setSort("name")}>Nom A-Z</Pill>
          <Pill active={sort === "score"} onClick={() => setSort("score")}>Meilleur score</Pill>
          <Pill active={sort === "activities"} onClick={() => setSort("activities")}>Activites faites</Pill>
          <Pill active={sort === "lessons"} onClick={() => setSort("lessons")}>Lecons</Pill>
          <Pill active={sort === "created"} onClick={() => setSort("created")}>Plus recents</Pill>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Role :</span>
          <Pill active={!roleFilter} onClick={() => setRoleFilter(null)}>Tous</Pill>
          <Pill active={roleFilter === "student"} onClick={() => setRoleFilter("student")}>Eleves</Pill>
          <Pill active={roleFilter === "teacher"} onClick={() => setRoleFilter("teacher")}>Professeurs</Pill>
          {isAdmin && <Pill active={roleFilter === "admin"} onClick={() => setRoleFilter("admin")}>Admins</Pill>}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..." className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-400" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase">
              <th className="text-left px-4 py-3">Utilisateur</th>
              <th className="text-center px-4 py-3">Role</th>
              <th className="text-center px-4 py-3">Classes</th>
              <th className="text-center px-4 py-3">Lecons</th>
              <th className="text-center px-4 py-3">Activites</th>
              <th className="text-center px-4 py-3">Score moy.</th>
              <th className="text-center px-4 py-3">Derniere activite</th>
              {isAdmin && <th className="text-right px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-slate-400">Aucun utilisateur trouve.</td></tr>
            ) : filtered.map(u => {
              const ago = daysSince(u.lastActivity);
              const isInactive = u.lastActivity && (Date.now() - new Date(u.lastActivity).getTime()) > 7 * 24 * 60 * 60 * 1000;
              return (
                <tr key={u.id} className="hover:bg-brand-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={"/admin/utilisateurs/" + u.id} className="flex items-center gap-2 hover:text-brand-700">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-300 to-accent-400 flex items-center justify-center text-white text-xs font-bold shrink-0">{u.name?.charAt(0) || "?"}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate text-sm">{u.name || "-"}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isAdmin ? <RoleChanger userId={u.id} currentRole={u.role} /> : <span className="text-xs capitalize text-slate-500">{u.role}</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{u.counts.classroomMemberships}</td>
                  <td className="px-4 py-3 text-center text-sm">{u.counts.lessonProgress}</td>
                  <td className="px-4 py-3 text-center text-sm">{u.counts.activityResults}</td>
                  <td className="px-4 py-3 text-center">
                    {u.avgScore > 0 ? (
                      <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (u.avgScore >= 80 ? "bg-green-100 text-green-700" : u.avgScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{u.avgScore}%</span>
                    ) : <span className="text-xs text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ago ? <span className={"text-[11px] font-medium " + (isInactive ? "text-amber-600" : "text-slate-500")}>{ago}</span> : <span className="text-xs text-slate-300">Jamais</span>}
                  </td>
                  {isAdmin && <td className="px-4 py-3 text-right"><DeleteUserBtn userId={u.id} email={u.email || ""} currentUserEmail={currentUserEmail} /></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={"text-xs px-3 py-1 rounded-full font-medium transition-all " + (active ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
      {children}
    </button>
  );
}
