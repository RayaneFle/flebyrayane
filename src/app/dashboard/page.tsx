import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { activityTypeLabels } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const [enrollments, results, classrooms] = await Promise.all([
    prisma.enrollment.count({ where: { userId: uid } }),
    prisma.activityResult.findMany({ where: { userId: uid }, include: { activity: { select: { title: true, type: true } } }, orderBy: { updatedAt: "desc" }, take: 10 }),
    prisma.classroomMember.findMany({ where: { userId: uid }, include: { classroom: { select: { name: true } } } }),
  ]);

  const avgScore = results.length > 0 ? results.reduce((a, r) => a + (r.score || 0), 0) / results.length : 0;
  const completed = results.filter(r => r.completed).length;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Bonjour, {session!.user.name} 👋</h1>
      <p className="text-slate-400 mb-8">Voici votre progression</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Stat v={enrollments} l="Cours suivis" e="📖" />
        <Stat v={completed} l="Exercices terminés" e="✅" />
        <Stat v={`${Math.round(avgScore)}%`} l="Score moyen" e="📊" />
        <Stat v={classrooms.length} l="Classes" e="🏫" />
      </div>

      {classrooms.length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-bold text-slate-800 mb-4">🏫 Mes classes</h2>
          <div className="flex flex-wrap gap-3">
            {classrooms.map(cm => <span key={cm.id} className="px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium">{cm.classroom.name}</span>)}
          </div>
        </div>
      )}

      <h2 className="font-heading text-lg font-bold text-slate-800 mb-4">📈 Activité récente</h2>
      <div className="bg-white rounded-2xl border border-brand-100 divide-y divide-slate-50">
        {results.length === 0 ? <p className="px-5 py-8 text-center text-slate-400 text-sm">Aucune activité encore. <Link href="/activites" className="text-brand-600 font-semibold">Jouer →</Link></p> :
          results.map(r => {
            const t = activityTypeLabels[r.activity.type] || { emoji: "📝", label: r.activity.type };
            return (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xl">{t.emoji}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{r.activity.title}</p><p className="text-xs text-slate-400">{r.completed ? "Terminé" : "En cours"} · {r.attempts} tentative{r.attempts > 1 ? "s" : ""}</p></div>
                <span className={`text-sm font-bold ${(r.score || 0) >= 60 ? "text-green-600" : (r.score || 0) >= 30 ? "text-amber-500" : "text-red-500"}`}>{Math.round(r.score || 0)}%</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function Stat({ v, l, e }: { v: number | string; l: string; e: string }) {
  return <div className="rounded-2xl border border-brand-100 p-5 text-center bg-white"><span className="text-xl">{e}</span><p className="font-heading text-2xl font-bold text-slate-800 mt-1">{v}</p><p className="text-xs text-slate-400">{l}</p></div>;
}
