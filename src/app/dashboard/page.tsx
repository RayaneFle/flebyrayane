import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { activityTypeLabels } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const [enrollments, results, classrooms, lessonProgress, memberOf] = await Promise.all([
    prisma.enrollment.count({ where: { userId: uid } }),
    prisma.activityResult.findMany({
      where: { userId: uid },
      include: { activity: { select: { title: true, type: true } } },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.classroomMember.findMany({
      where: { userId: uid },
      include: { classroom: { select: { id: true, name: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: uid },
      include: {
        lesson: {
          select: {
            id: true, title: true,
            section: { select: { title: true, course: { select: { slug: true, title: true } } } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.classroomMember.findMany({
      where: { userId: uid },
      include: {
        classroom: {
          include: {
            courses: { include: { course: { select: { slug: true, title: true, sections: { include: { lessons: { select: { id: true, title: true }, orderBy: { position: "asc" } } }, orderBy: { position: "asc" } } } } } },
          },
        },
      },
    }),
  ]);

  const avgScore = results.length > 0 ? results.reduce((a, r) => a + (r.score || 0), 0) / results.length : 0;
  const completedCount = results.filter(r => r.completed).length;
  const completedLessons = lessonProgress.filter(p => p.status === "completed").length;
  const inProgressLessons = lessonProgress.filter(p => p.status === "in_progress");

  // Find "resume" lesson - last in_progress, or first not started
  const progressIds = new Set(lessonProgress.map(p => p.lessonId));
  const completedIds = new Set(lessonProgress.filter(p => p.status === "completed").map(p => p.lessonId));

  let resumeLesson: { id: string; title: string; courseSlug: string; courseTitle: string; sectionTitle: string } | null = null;

  // First try: last lesson in progress
  if (inProgressLessons.length > 0) {
    const lp = inProgressLessons[0];
    resumeLesson = {
      id: lp.lesson.id,
      title: lp.lesson.title,
      courseSlug: lp.lesson.section.course.slug,
      courseTitle: lp.lesson.section.course.title,
      sectionTitle: lp.lesson.section.title,
    };
  }

  // If no in progress, find first not started lesson from assigned courses
  if (!resumeLesson) {
    for (const cm of memberOf) {
      for (const cc of cm.classroom.courses) {
        for (const s of cc.course.sections) {
          for (const l of s.lessons) {
            if (!completedIds.has(l.id) && !progressIds.has(l.id)) {
              resumeLesson = {
                id: l.id, title: l.title,
                courseSlug: cc.course.slug, courseTitle: cc.course.title,
                sectionTitle: s.title,
              };
              break;
            }
          }
          if (resumeLesson) break;
        }
        if (resumeLesson) break;
      }
      if (resumeLesson) break;
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Bonjour, {session!.user.name} !</h1>
        <p className="text-sm text-slate-400 mt-1">Voici votre progression</p>
      </div>

      {/* Resume Card */}
      {resumeLesson && (
        <Link href={"/cours/" + resumeLesson.courseSlug + "/lecon/" + resumeLesson.id}
          className="block mb-8 bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl p-6 text-white hover:shadow-lg transition-all hover:scale-[1.01]">
          <p className="text-brand-100 text-xs font-medium mb-1">Reprendre où vous en étiez</p>
          <p className="font-heading text-xl font-bold">{resumeLesson.title}</p>
          <p className="text-brand-100 text-sm mt-1">{resumeLesson.courseTitle} &gt; {resumeLesson.sectionTitle}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2 text-sm font-bold">
            Continuer &rarr;
          </div>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-brand-600">{completedLessons}</p>
          <p className="text-xs text-slate-400 mt-1">Leçons terminées</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-accent-600">{completedCount}</p>
          <p className="text-xs text-slate-400 mt-1">Activités faites</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className={"text-2xl font-bold " + (avgScore >= 60 ? "text-green-600" : "text-amber-500")}>{Math.round(avgScore)}%</p>
          <p className="text-xs text-slate-400 mt-1">Score moyen</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{classrooms.length}</p>
          <p className="text-xs text-slate-400 mt-1">Classe{classrooms.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Classes & Courses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Mes cours</h2>
          {memberOf.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400 mb-3">Rejoignez une classe pour acceder aux cours</p>
              <Link href="/dashboard/rejoindre" className="text-sm font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-lg">Rejoindre une classe</Link>
            </div>
          ) : (
            <div className="space-y-3">{memberOf.map(cm => (
              <div key={cm.id}>
                <p className="text-xs font-bold text-brand-700 mb-1.5">{cm.classroom.name}</p>
                {cm.classroom.courses.length === 0 ? (
                  <p className="text-xs text-slate-400 pl-2">Aucun cours assigne</p>
                ) : (
                  <div className="space-y-1 pl-2">{cm.classroom.courses.map((cc: any) => {
                    const totalLessons = cc.course.sections.reduce((s: number, sec: any) => s + sec.lessons.length, 0);
                    const doneLessons = cc.course.sections.reduce((s: number, sec: any) => s + sec.lessons.filter((l: any) => completedIds.has(l.id)).length, 0);
                    return (
                      <Link key={cc.courseId} href={"/cours/" + cc.course.slug} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-brand-50 transition-colors">
                        <span className="text-sm text-slate-700 font-medium truncate">{cc.course.title}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{width: (totalLessons > 0 ? doneLessons/totalLessons*100 : 0) + "%"}} />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{doneLessons}/{totalLessons}</span>
                        </div>
                      </Link>
                    );
                  })}</div>
                )}
              </div>
            ))}</div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Activité récente</h2>
          {results.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400 mb-3">Pas encore d'activité</p>
              <Link href="/activites" className="text-sm font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-lg">Jouer</Link>
            </div>
          ) : (
            <div className="space-y-1">{results.map(r => {
              const t = activityTypeLabels[r.activity.type] || { emoji: "?", label: r.activity.type };
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-slate-50">
                  <span className="text-base">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{r.activity.title}</p>
                    <p className="text-[10px] text-slate-400">{r.completed ? "Terminé" : "En cours"}</p>
                  </div>
                  <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + ((r.score || 0) >= 80 ? "bg-green-100 text-green-700" : (r.score || 0) >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{Math.round(r.score || 0)}%</span>
                </div>
              );
            })}</div>
          )}
        </div>
      </div>
    </div>
  );
}