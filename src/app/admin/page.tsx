import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id || "";
  const isAdmin = session?.user?.role === "admin";

  const [myActivities, myCourses, myClassrooms, totalUsers, totalResults, recentResults, recentCourses] = await Promise.all([
    prisma.activity.count({ where: { createdById: uid } }),
    prisma.course.count({ where: { authorId: uid } }),
    prisma.classroom.findMany({
      where: { ownerId: uid },
      select: {
        id: true, name: true, code: true,
        members: { select: { userId: true } },
        subclasses: { select: { id: true, name: true } },
        courses: { select: { courseId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    isAdmin ? prisma.user.count() : Promise.resolve(0),
    prisma.activityResult.count({ where: { activity: { createdById: uid } } }),
    prisma.activityResult.findMany({
      where: { activity: { createdById: uid }, completed: true },
      select: { score: true, user: { select: { name: true } }, activity: { select: { title: true, type: true } } },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),
    prisma.course.findMany({
      where: isAdmin ? {} : { authorId: uid },
      select: {
        id: true, title: true, slug: true,
        sections: { select: { id: true, title: true }, orderBy: { position: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const totalStudents = new Set(myClassrooms.flatMap(c => c.members.map(m => m.userId))).size;
  const avgScore = recentResults.length > 0
    ? Math.round(recentResults.reduce((s, r) => s + (r.score || 0), 0) / recentResults.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-400 mt-1">Bienvenue, {session?.user?.name}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-5 text-white">
          <p className="text-brand-100 text-xs font-medium">Mes cours</p>
          <p className="font-heading text-3xl font-bold mt-1">{myCourses}</p>
        </div>
        <div className="bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl p-5 text-white">
          <p className="text-accent-100 text-xs font-medium">Mes activités</p>
          <p className="font-heading text-3xl font-bold mt-1">{myActivities}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white">
          <p className="text-green-100 text-xs font-medium">Élèves</p>
          <p className="font-heading text-3xl font-bold mt-1">{totalStudents}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <p className="text-amber-100 text-xs font-medium">Score moyen</p>
          <p className="font-heading text-3xl font-bold mt-1">{avgScore}%</p>
        </div>
      </div>

      {/* Quick Course Access */}
      {recentCourses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Accès rapide - Mes cours</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentCourses.map((c: any) => (
              <Link key={c.id} href={"/admin/cours/" + c.id} className="block p-4 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/30 transition-all">
                <p className="text-sm font-bold text-slate-800 truncate">{c.title}</p>
                <p className="text-[10px] text-slate-400 mt-1">{c.sections.length} section{c.sections.length > 1 ? "s" : ""}</p>
                <div className="mt-2 space-y-0.5">
                  {c.sections.slice(0, 3).map((s: any) => (
                    <Link key={s.id} href={"/admin/cours/" + c.id + "/sections/" + s.id + "/lessons/new"}
                      className="flex items-center justify-between text-[10px] py-1 px-2 rounded bg-slate-50 hover:bg-brand-100 transition-colors group">
                      <span className="text-slate-500 truncate">{s.title}</span>
                      <span className="text-brand-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">+ Lecon</span>
                    </Link>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Actions rapides</h2>
          <div className="space-y-2">
            <Link href="/admin/cours/creer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-lg">+</div>
              <div><p className="text-sm font-bold text-slate-800">Créer un cours</p><p className="text-[11px] text-slate-400">Nouveau cours structuré</p></div>
            </Link>
            <Link href="/admin/activites/creer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center text-lg">+</div>
              <div><p className="text-sm font-bold text-slate-800">Créer une activité</p><p className="text-[11px] text-slate-400">QCM, memory, pendu...</p></div>
            </Link>
            <Link href="/admin/classes" className="flex items-center gap-3 p-3 rounded-xl hover:bg-green-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg">+</div>
              <div><p className="text-sm font-bold text-slate-800">Gérer les classes</p><p className="text-[11px] text-slate-400">Classes et sous-classes</p></div>
            </Link>
            {isAdmin && <Link href="/admin/utilisateurs" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">U</div>
              <div><p className="text-sm font-bold text-slate-800">Utilisateurs</p><p className="text-[11px] text-slate-400">Gerer les comptes</p></div>
            </Link>}
          </div>
        </div>

        {/* My Classes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Mes classes</h2>
          {myClassrooms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">Aucune classe</p>
              <Link href="/admin/classes" className="text-xs text-brand-600 font-medium mt-2 inline-block">Creer une classe</Link>
            </div>
          ) : (
            <div className="space-y-2">{myClassrooms.map(cls => (
              <Link key={cls.id} href={"/admin/classes/" + cls.id} className="block p-3 rounded-xl hover:bg-brand-50 transition-colors border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{cls.name}</p>
                    <p className="text-[11px] text-slate-400">{cls.members.length} élèves | {cls.courses.length} cours</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {cls.subclasses.map((sc: any) => (
                      <span key={sc.id} className="text-[9px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded">{sc.name}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Activité récente</h2>
          {recentResults.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucune activité récente</p>
          ) : (
            <div className="space-y-1.5">{recentResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 truncate font-medium">{r.user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{r.activity.title}</p>
                </div>
                <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + ((r.score || 0) >= 80 ? "bg-green-100 text-green-700" : (r.score || 0) >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{Math.round(r.score || 0)}%</span>
              </div>
            ))}</div>
          )}
        </div>
      </div>

      {/* Quick stats per class */}
      {myClassrooms.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Aperçu par classe</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-bold text-slate-500 py-3 px-3">Classe</th>
                  <th className="text-center text-xs font-bold text-slate-500 py-3 px-3">Élèves</th>
                  <th className="text-center text-xs font-bold text-slate-500 py-3 px-3">Cours</th>
                  <th className="text-center text-xs font-bold text-slate-500 py-3 px-3">Sous-classes</th>
                  <th className="text-right text-xs font-bold text-slate-500 py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody>{myClassrooms.map(cls => (
                <tr key={cls.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="py-3 px-3">
                    <p className="text-sm font-bold text-slate-800">{cls.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{cls.code}</p>
                  </td>
                  <td className="text-center py-3 px-3"><span className="text-sm font-bold text-slate-700">{cls.members.length}</span></td>
                  <td className="text-center py-3 px-3"><span className="text-sm font-bold text-slate-700">{cls.courses.length}</span></td>
                  <td className="text-center py-3 px-3"><span className="text-sm text-slate-500">{cls.subclasses.length}</span></td>
                  <td className="text-right py-3 px-3">
                    <Link href={"/admin/classes/" + cls.id} className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg">Voir le suivi</Link>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}