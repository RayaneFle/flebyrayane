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
      take: 6,
    }),
    prisma.course.findMany({
      where: { authorId: uid },
      select: {
        id: true, title: true, slug: true, level: true,
        sections: { select: { id: true, title: true }, orderBy: { position: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const totalStudents = new Set(myClassrooms.flatMap(c => c.members.map(m => m.userId))).size;
  const avgScore = recentResults.length > 0
    ? Math.round(recentResults.reduce((s, r) => s + (r.score || 0), 0) / recentResults.length)
    : 0;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-slate-400 mt-1">Bienvenue, {session?.user?.name} 👋</p>
      </div>

      {/* KPI compacts stylés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard icon="📚" label="Cours" value={myCourses} gradient="from-brand-500 to-brand-600" />
        <KPICard icon="🎮" label="Activités" value={myActivities} gradient="from-accent-500 to-accent-600" />
        <KPICard icon="👥" label="Élèves" value={totalStudents} gradient="from-green-500 to-emerald-600" />
        <KPICard icon="📈" label="Score moyen" value={avgScore + "%"} gradient="from-amber-500 to-orange-600" />
      </div>

      {/* Mes cours - SECTION PRINCIPALE */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">📚 Mes cours</h2>
          <Link href="/admin/cours/creer" className="text-sm font-semibold bg-brand-500 text-white px-4 py-2 rounded-xl hover:bg-brand-600 hover:shadow-glow transition-all">
            + Nouveau cours
          </Link>
        </div>
        {recentCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <span className="text-4xl">📖</span>
            <p className="text-slate-500 mt-3">Aucun cours pour l'instant.</p>
            <Link href="/admin/cours/creer" className="inline-block mt-4 text-brand-600 font-semibold">Créer votre premier cours →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCourses.map((c: any) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all flex flex-col overflow-hidden">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Link href={"/admin/cours/" + c.id} className="font-heading font-bold text-slate-900 hover:text-brand-700 text-base leading-tight flex-1">
                      {c.title}
                    </Link>
                    {c.level && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 shrink-0">{c.level}</span>}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-3">{c.sections.length} section{c.sections.length > 1 ? "s" : ""}</p>
                  {c.sections.length > 0 ? (
                    <div className="space-y-1.5">
                      {c.sections.slice(0, 3).map((s: any) => (
                        <Link key={s.id} href={"/admin/cours/" + c.id + "/sections/" + s.id + "/lessons/new"}
                          className="flex items-center justify-between gap-2 text-xs py-2 px-3 rounded-lg bg-slate-50 hover:bg-brand-50 transition-colors group">
                          <span className="text-slate-600 truncate flex-1">{s.title}</span>
                          <span className="text-brand-600 font-bold shrink-0 text-[11px] bg-white px-2 py-0.5 rounded group-hover:bg-brand-500 group-hover:text-white transition-colors">+ Leçon</span>
                        </Link>
                      ))}
                      {c.sections.length > 3 && <p className="text-[10px] text-slate-400 text-center pt-1">+ {c.sections.length - 3} autres</p>}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">Pas encore de sections</p>
                  )}
                </div>
                <Link href={"/admin/cours/" + c.id} className="border-t border-slate-100 px-5 py-3 text-center text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
                  Ouvrir le cours →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions rapides */}
      <section className="mb-6">
        <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">⚡ Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton href="/admin/cours/creer" icon="📚" label="Nouveau cours" color="brand" />
          <ActionButton href="/admin/activites/creer" icon="🎮" label="Nouvelle activité" color="accent" />
          <ActionButton href="/admin/classes" icon="🏫" label="Gérer classes" color="green" />
          {isAdmin && <ActionButton href="/admin/utilisateurs" icon="👥" label="Utilisateurs" color="slate" />}
        </div>
      </section>

      {/* Mes classes + Activité récente côte à côte */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">🏫 Mes classes ({myClassrooms.length})</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {myClassrooms.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">Aucune classe</p>
                <Link href="/admin/classes" className="inline-block mt-3 text-sm text-brand-600 font-semibold">Créer une classe →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myClassrooms.map(cls => (
                  <Link key={cls.id} href={"/admin/classes/" + cls.id} className="flex items-center justify-between gap-3 p-4 hover:bg-brand-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{cls.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <span>{cls.members.length} élève{cls.members.length > 1 ? "s" : ""}</span>
                        <span className="mx-1.5">·</span>
                        <span>{cls.courses.length} cours</span>
                        {cls.subclasses.length > 0 && (<><span className="mx-1.5">·</span><span>{cls.subclasses.length} sous-classe{cls.subclasses.length > 1 ? "s" : ""}</span></>)}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded shrink-0">{cls.code}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">📈 Activité récente</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {recentResults.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">Aucune activité récente</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{r.user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.activity.title}</p>
                    </div>
                    <span className={"text-xs font-bold px-2.5 py-1 rounded-full shrink-0 " + ((r.score || 0) >= 80 ? "bg-green-100 text-green-700" : (r.score || 0) >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{Math.round(r.score || 0)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, gradient }: { icon: string; label: string; value: string | number; gradient: string }) {
  return (
    <div className={"bg-gradient-to-br " + gradient + " rounded-2xl p-4 text-white shadow-sm hover:shadow-md transition-shadow"}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-white/80 truncate">{label}</p>
          <p className="font-heading text-xl font-bold leading-tight">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100",
    accent: "bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100",
    green: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
  };
  return (
    <Link href={href} className={"flex items-center gap-3 p-4 rounded-2xl border transition-all " + colors[color]}>
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
}
