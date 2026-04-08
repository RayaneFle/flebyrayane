import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { activityTypeLabels } from "@/lib/utils";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id || "";
  const isAdmin = session?.user?.role === "admin";

  const [myActivities, myCourses, myClasses, totalUsers, totalResults] = await Promise.all([
    prisma.activity.count({ where: { createdById: uid } }),
    prisma.course.count({ where: { authorId: uid } }),
    prisma.classroom.count({ where: { ownerId: uid } }),
    isAdmin ? prisma.user.count() : Promise.resolve(0),
    prisma.activityResult.count({ where: { activity: { createdById: uid } } }),
  ]);

  // Get my classrooms with members
  const classrooms = await prisma.classroom.findMany({
    where: { ownerId: uid },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      courses: { include: { course: { select: { id: true, title: true, slug: true, sections: { include: { lessons: { select: { id: true, title: true, blocks: { where: { type: "activity" }, select: { activityId: true } } } } } } } } } },
      activities: { include: { activity: { select: { id: true, title: true, type: true } } } },
    },
  });

  // Get all student IDs from my classrooms
  const studentIds = [...new Set(classrooms.flatMap(c => c.members.map(m => m.userId)))];

  // Get all activity results for these students
  const allLessonProgress = await prisma.lessonProgress.findMany({
    where: { userId: { in: studentIds } },
    include: { user: { select: { id: true } }, lesson: { select: { title: true } } },
  });

  const allResults = await prisma.activityResult.findMany({
    where: { userId: { in: studentIds } },
    include: {
      user: { select: { id: true, name: true } },
      activity: { select: { id: true, title: true, type: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: { in: studentIds }, course: { authorId: uid } },
    include: { user: { select: { id: true, name: true } }, course: { select: { id: true, title: true } } },
  });

  // Build student progress map
  const studentProgress: Record<string, { name: string; email: string; courses: any[]; activities: any[]; avgScore: number; totalDone: number; lessons: any[] }> = {};
  
  classrooms.forEach(cls => {
    cls.members.forEach(m => {
      if (!studentProgress[m.userId]) {
        studentProgress[m.userId] = { name: m.user.name || "?", email: m.user.email || "", courses: [], activities: [], avgScore: 0, totalDone: 0, lessons: [] };
      }
    });
  });

  // Add course progress
  enrollments.forEach(e => {
    if (studentProgress[e.userId]) {
      studentProgress[e.userId].courses.push({ title: e.course.title, courseId: e.course.id, progress: e.progress });
    }
  });

  // Add activity results
  allResults.forEach(r => {
    if (studentProgress[r.userId]) {
      studentProgress[r.userId].activities.push({
        title: r.activity.title,
        type: r.activity.type,
        score: r.score || 0,
        completed: r.completed,
        attempts: r.attempts,
      });
      if (r.completed) studentProgress[r.userId].totalDone++;
    }
  });

  allLessonProgress.forEach(lp => {
    if (studentProgress[lp.userId]) {
      studentProgress[lp.userId].lessons.push({ title: lp.lesson.title, status: lp.status });
    }
  });

  // Calculate averages
  Object.values(studentProgress).forEach(sp => {
    const completedActs = sp.activities.filter(a => a.completed);
    sp.avgScore = completedActs.length > 0 ? completedActs.reduce((sum, a) => sum + a.score, 0) / completedActs.length : 0;
  });

  const students = Object.entries(studentProgress).sort((a, b) => b[1].totalDone - a[1].totalDone);

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-8">Tableau de bord</h1>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <Stat v={myActivities} l="Mes activites" e="\ud83c\udfae" />
        <Stat v={myCourses} l="Mes cours" e="\ud83d\udcd6" />
        <Stat v={myClasses} l="Mes classes" e="\ud83c\udfeb" />
        <Stat v={totalResults} l="Participations" e="\ud83d\udcca" />
        {isAdmin && <Stat v={totalUsers} l="Utilisateurs" e="\ud83d\udc65" />}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <QA href="/admin/activites/creer" e="\ud83c\udfae" t="Creer une activite" />
        <QA href="/admin/cours/creer" e="\ud83d\udcd6" t="Creer un cours" />
        <QA href="/admin/classes" e="\ud83c\udfeb" t="Gerer les classes" />
        {isAdmin && <QA href="/admin/utilisateurs" e="\ud83d\udc65" t="Utilisateurs" />}
      </div>

      <h2 className="font-heading text-xl font-bold text-slate-900 mb-6">\ud83d\udcca Suivi detaille des eleves</h2>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center">
          <span className="text-4xl">\ud83d\udc65</span>
          <p className="text-slate-400 mt-4">Aucun eleve dans vos classes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map(([userId, sp]) => (
            <details key={userId} className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
              <summary className="px-6 py-4 cursor-pointer select-none hover:bg-brand-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-300 to-accent-400 flex items-center justify-center text-white font-bold">{sp.name.charAt(0)}</div>
                    <div>
                      <p className="font-heading font-bold text-slate-800">{sp.name}</p>
                      <p className="text-xs text-slate-400">{sp.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center"><p className="text-lg font-bold text-brand-600">{sp.totalDone}</p><p className="text-[10px] text-slate-400">Exercices</p></div>
                    <div className="text-center"><p className={`text-lg font-bold ${sp.avgScore >= 60 ? "text-green-600" : sp.avgScore >= 30 ? "text-amber-500" : "text-red-500"}`}>{Math.round(sp.avgScore)}%</p><p className="text-[10px] text-slate-400">Moyenne</p></div>
                    <div className="text-center"><p className="text-lg font-bold text-slate-600">{sp.courses.length}</p><p className="text-[10px] text-slate-400">Cours</p></div>
                  </div>
                </div>
              </summary>
              <div className="px-6 pb-6 border-t border-slate-100">
                {sp.courses.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cours inscrits</p>
                    <div className="space-y-2">{sp.courses.map((c: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-brand-50/50 rounded-xl">
                        <span className="text-sm font-medium text-slate-700">{c.title}</span>
                        <span className="text-xs text-brand-600 font-medium">Inscrit</span>
                      </div>
                    ))}</div>
                  </div>
                )}
                {sp.activities.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Activites ({sp.activities.length})</p>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="text-left py-2 px-2">Activite</th>
                          <th className="text-center py-2 px-2">Type</th>
                          <th className="text-center py-2 px-2">Score</th>
                          <th className="text-center py-2 px-2">Etat</th>
                          <th className="text-center py-2 px-2">Tentatives</th>
                        </tr></thead>
                        <tbody>{sp.activities.map((a: any, i: number) => {
                          const t = activityTypeLabels[a.type] || { emoji: "?", label: a.type };
                          return (
                            <tr key={i} className="border-b border-slate-50 last:border-0">
                              <td className="py-2 px-2 text-sm text-slate-700">{a.title}</td>
                              <td className="py-2 px-2 text-center text-sm">{t.emoji}</td>
                              <td className="py-2 px-2 text-center"><span className={`text-sm font-bold ${a.score >= 60 ? "text-green-600" : a.score >= 30 ? "text-amber-500" : "text-red-500"}`}>{Math.round(a.score)}%</span></td>
                              <td className="py-2 px-2 text-center">{a.completed ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Termine</span> : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">En cours</span>}</td>
                              <td className="py-2 px-2 text-center text-sm text-slate-500">{a.attempts}</td>
                            </tr>
                          );
                        })}</tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mt-4">Aucune activite realisee.</p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ v, l, e }: { v: number; l: string; e: string }) {
  return <div className="rounded-2xl border border-brand-100 p-5 text-center bg-white"><span className="text-xl">{e}</span><p className="font-heading text-2xl font-bold text-slate-800 mt-1">{v}</p><p className="text-xs text-slate-400">{l}</p></div>;
}
function QA({ href, e, t }: { href: string; e: string; t: string }) {
  return <Link href={href} className="flex items-center gap-4 bg-white border-2 border-brand-100 rounded-2xl p-5 card-hover hover:border-brand-300"><span className="text-2xl">{e}</span><p className="font-heading font-bold text-slate-800">{t}</p></Link>;
}