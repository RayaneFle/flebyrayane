import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { activityTypeLabels, levelColors } from "@/lib/utils";
import Link from "next/link";

export default async function UserDetailPage({ params }: { params: { userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) redirect("/admin");

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      _count: { select: { activityResults: true, enrollments: true, classroomMemberships: true } },
    },
  });
  if (!user) notFound();

  const [results, lessonProgress, enrollments, memberships] = await Promise.all([
    prisma.activityResult.findMany({
      where: { userId: params.userId },
      include: { activity: { select: { id: true, title: true, type: true, level: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: params.userId },
      include: {
        lesson: {
          select: {
            id: true, title: true,
            section: { select: { title: true, course: { select: { title: true, slug: true } } } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.enrollment.findMany({
      where: { userId: params.userId },
      include: { course: { select: { id: true, title: true, level: true } } },
    }),
    prisma.classroomMember.findMany({
      where: { userId: params.userId },
      include: { classroom: { select: { id: true, name: true, code: true } } },
    }),
  ]);

  const completed = results.filter(r => r.completed);
  const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length) : 0;
  const completedLessons = lessonProgress.filter(p => p.status === "completed").length;
  const inProgressLessons = lessonProgress.filter(p => p.status === "in_progress").length;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin/utilisateurs" className="text-sm text-brand-600 hover:text-brand-700 mb-4 inline-block">&#8592; Tous les utilisateurs</Link>
      
      <div className="bg-gradient-to-br from-brand-500 to-accent-500 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold">
            {user.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold">{user.name || "Sans nom"}</h1>
            <p className="text-brand-100 text-sm">{user.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded capitalize">{user.role}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-brand-600">{completedLessons}</p>
          <p className="text-xs text-slate-400">Leçons terminées</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-accent-600">{completed.length}</p>
          <p className="text-xs text-slate-400">Activités faites</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className={"text-2xl font-bold " + (avgScore >= 60 ? "text-green-600" : "text-amber-500")}>{avgScore}%</p>
          <p className="text-xs text-slate-400">Score moyen</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{memberships.length}</p>
          <p className="text-xs text-slate-400">Classes</p>
        </div>
      </div>

      {memberships.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="font-heading font-bold text-slate-800 mb-3">Classes</h2>
          <div className="flex flex-wrap gap-2">
            {memberships.map((m: any) => (
              <Link key={m.id} href={"/admin/classes/" + m.classroom.id}
                className="text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-100 font-medium">
                {m.classroom.name} <span className="text-xs text-brand-400 font-mono">{m.classroom.code}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {enrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="font-heading font-bold text-slate-800 mb-3">Inscriptions aux cours</h2>
          <div className="space-y-2">
            {enrollments.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{e.course.title}</span>
                <span className={"text-xs font-bold px-2 py-0.5 rounded " + (levelColors[e.course.level] || "")}>{e.course.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lessonProgress.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="font-heading font-bold text-slate-800 mb-3">Progression des leçons ({lessonProgress.length})</h2>
          <div className="space-y-1">
            {lessonProgress.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.lesson.title}</p>
                  <p className="text-[10px] text-slate-400">{p.lesson.section.course.title} &gt; {p.lesson.section.title}</p>
                </div>
                <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 " +
                  (p.status === "completed" ? "bg-green-100 text-green-700" :
                   p.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                   "bg-slate-100 text-slate-400")}>
                  {p.status === "completed" ? "Terminée" : p.status === "in_progress" ? "En cours" : "À faire"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="font-heading font-bold text-slate-800 mb-3">Activités faites ({results.length})</h2>
          <div className="space-y-1">
            {results.map((r: any) => {
              const t = activityTypeLabels[r.activity.type] || { emoji: "?", label: r.activity.type };
              return (
                <div key={r.id} className="flex items-center justify-between py-2 px-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span>{t.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{r.activity.title}</p>
                      <p className="text-[10px] text-slate-400">{t.label} &middot; {r.attempts} tentative{r.attempts > 1 ? "s" : ""} &middot; {new Date(r.updatedAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                  <span className={"text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 " +
                    ((r.score || 0) >= 80 ? "bg-green-100 text-green-700" :
                     (r.score || 0) >= 50 ? "bg-amber-100 text-amber-700" :
                     "bg-red-100 text-red-700")}>
                    {Math.round(r.score || 0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {results.length === 0 && lessonProgress.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-slate-400">Cet utilisateur n'a pas encore utilisé la plateforme.</p>
        </div>
      )}
    </div>
  );
}