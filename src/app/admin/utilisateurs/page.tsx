import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import RoleChanger from "./RoleChanger";
import DeleteUserBtn from "./DeleteUserBtn";

export default async function AdminUsersPage({ searchParams }: { searchParams: { sort?: string; role?: string; search?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) redirect("/admin");
  const isAdmin = session.user.role === "admin";

  const sp = await (searchParams as any);
  const sort = sp?.sort || "recent";
  const roleFilter = sp?.role;
  const search = sp?.search?.toLowerCase() || "";

  const users = await prisma.user.findMany({
    where: {
      ...(roleFilter ? { role: roleFilter } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
    },
    include: {
      _count: { select: { activityResults: true, enrollments: true, classroomMemberships: true, lessonProgress: true } },
      activityResults: { select: { updatedAt: true, score: true, completed: true } },
    },
  });

  const enrichedUsers = users.map(u => {
    const completed = u.activityResults.filter(r => r.completed);
    const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length) : 0;
    const lastActivity = u.activityResults.length > 0 ? u.activityResults.map(r => r.updatedAt).sort((a, b) => b.getTime() - a.getTime())[0] : null;
    return { ...u, avgScore, lastActivity };
  });

  const sorted = [...enrichedUsers].sort((a, b) => {
    if (sort === "recent") return (b.lastActivity?.getTime() || 0) - (a.lastActivity?.getTime() || 0);
    if (sort === "name") return (a.name || "").localeCompare(b.name || "");
    if (sort === "score") return b.avgScore - a.avgScore;
    if (sort === "activities") return b._count.activityResults - a._count.activityResults;
    if (sort === "lessons") return b._count.lessonProgress - a._count.lessonProgress;
    if (sort === "created") return b.createdAt.getTime() - a.createdAt.getTime();
    return 0;
  });

  function daysSince(date: Date | null) {
    if (!date) return null;
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd hui";
    if (days === 1) return "Hier";
    if (days < 7) return "Il y a " + days + " jours";
    if (days < 30) return "Il y a " + Math.floor(days / 7) + " sem.";
    return "Il y a " + Math.floor(days / 30) + " mois";
  }

  function getSortUrl(newSort: string) {
    const params = new URLSearchParams();
    params.set("sort", newSort);
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);
    return "/admin/utilisateurs?" + params.toString();
  }

  function getRoleUrl(newRole: string | null) {
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (newRole) params.set("role", newRole);
    if (search) params.set("search", search);
    return "/admin/utilisateurs?" + params.toString();
  }

  const inactiveCount = enrichedUsers.filter(u => !u.lastActivity || (Date.now() - u.lastActivity.getTime()) > 7 * 24 * 60 * 60 * 1000).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Utilisateurs</h1>
          <p className="text-sm text-slate-400">{sorted.length} utilisateur{sorted.length > 1 ? "s" : ""} {inactiveCount > 0 && " - " + inactiveCount + " inactif" + (inactiveCount > 1 ? "s" : "") + " (>7j)"}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Trier par :</span>
          <SortPill href={getSortUrl("recent")} active={sort === "recent"}>Activite recente</SortPill>
          <SortPill href={getSortUrl("name")} active={sort === "name"}>Nom A-Z</SortPill>
          <SortPill href={getSortUrl("score")} active={sort === "score"}>Meilleur score</SortPill>
          <SortPill href={getSortUrl("activities")} active={sort === "activities"}>Activites faites</SortPill>
          <SortPill href={getSortUrl("lessons")} active={sort === "lessons"}>Lecons</SortPill>
          <SortPill href={getSortUrl("created")} active={sort === "created"}>Plus recents</SortPill>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Role :</span>
          <SortPill href={getRoleUrl(null)} active={!roleFilter}>Tous</SortPill>
          <SortPill href={getRoleUrl("student")} active={roleFilter === "student"}>Eleves</SortPill>
          <SortPill href={getRoleUrl("teacher")} active={roleFilter === "teacher"}>Professeurs</SortPill>
          {isAdmin && <SortPill href={getRoleUrl("admin")} active={roleFilter === "admin"}>Admins</SortPill>}
        </div>
        <form method="GET" action="/admin/utilisateurs" className="flex items-center gap-2">
          <input type="hidden" name="sort" value={sort} />
          {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
          <input name="search" defaultValue={search} placeholder="Rechercher par nom ou email..." className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-400" />
          <button type="submit" className="px-3 py-1.5 bg-brand-500 text-white text-xs font-bold rounded-lg hover:bg-brand-600">Rechercher</button>
        </form>
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
            {sorted.length === 0 ? (
              <tr><td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-sm text-slate-400">Aucun utilisateur trouve.</td></tr>
            ) : sorted.map(u => {
              const ago = daysSince(u.lastActivity);
              const isInactive = u.lastActivity && (Date.now() - u.lastActivity.getTime()) > 7 * 24 * 60 * 60 * 1000;
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
                  <td className="px-4 py-3 text-center text-sm">{u._count.classroomMemberships}</td>
                  <td className="px-4 py-3 text-center text-sm">{u._count.lessonProgress}</td>
                  <td className="px-4 py-3 text-center text-sm">{u._count.activityResults}</td>
                  <td className="px-4 py-3 text-center">
                    {u.avgScore > 0 ? (
                      <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (u.avgScore >= 80 ? "bg-green-100 text-green-700" : u.avgScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{u.avgScore}%</span>
                    ) : <span className="text-xs text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {ago ? <span className={"text-[11px] font-medium " + (isInactive ? "text-amber-600" : "text-slate-500")}>{ago}</span> : <span className="text-xs text-slate-300">Jamais</span>}
                  </td>
                  {isAdmin && <td className="px-4 py-3 text-right"><DeleteUserBtn userId={u.id} email={u.email || ""} currentUserEmail={session.user.email || ""} /></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={"text-xs px-3 py-1 rounded-full font-medium transition-all " + (active ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
      {children}
    </Link>
  );
}
