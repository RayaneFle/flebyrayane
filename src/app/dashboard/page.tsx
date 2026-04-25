import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { activityTypeLabels } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const [results, lessonProgress, memberOf, classroomPosts, freeActivities] = await Promise.all([
    prisma.activityResult.findMany({
      where: { userId: uid },
      include: { activity: { select: { title: true, type: true } } },
      orderBy: { updatedAt: "desc" },
      take: 6,
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
            courses: { include: { course: { select: { id: true, slug: true, title: true, level: true, sections: { include: { lessons: { select: { id: true, title: true }, orderBy: { position: "asc" } } }, orderBy: { position: "asc" } } } } } },
            activities: { include: { activity: { select: { id: true, title: true, type: true, level: true } } } },
            posts: { take: 3, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
          },
        },
      },
    }),
    Promise.resolve(null),
    prisma.activity.findMany({ where: { isPublic: true }, take: 6, orderBy: { createdAt: "desc" }, select: { id: true, title: true, type: true, level: true } }),
  ]);

  const avgScore = results.length > 0 ? results.reduce((a, r) => a + (r.score || 0), 0) / results.length : 0;
  const completedActivities = results.filter(r => r.completed).length;
  const completedLessons = lessonProgress.filter(p => p.status === "completed").length;
  const inProgressLessons = lessonProgress.filter(p => p.status === "in_progress");

  const completedIds = new Set(lessonProgress.filter(p => p.status === "completed").map(p => p.lessonId));
  const progressIds = new Set(lessonProgress.map(p => p.lessonId));

  // Resume lesson
  let resumeLesson: { id: string; title: string; courseSlug: string; courseTitle: string; sectionTitle: string } | null = null;
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
  if (!resumeLesson) {
    for (const cm of memberOf) {
      for (const cc of cm.classroom.courses) {
        for (const s of cc.course.sections) {
          for (const l of s.lessons) {
            if (!completedIds.has(l.id) && !progressIds.has(l.id)) {
              resumeLesson = { id: l.id, title: l.title, courseSlug: cc.course.slug, courseTitle: cc.course.title, sectionTitle: s.title };
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

  // Build "my courses" with progress
  const myCoursesMap = new Map<string, { course: any; classroomName: string; total: number; done: number }>();
  for (const cm of memberOf) {
    for (const cc of cm.classroom.courses) {
      const total = cc.course.sections.reduce((s: number, sec: any) => s + sec.lessons.length, 0);
      const done = cc.course.sections.reduce((s: number, sec: any) => s + sec.lessons.filter((l: any) => completedIds.has(l.id)).length, 0);
      if (!myCoursesMap.has(cc.course.id)) {
        myCoursesMap.set(cc.course.id, { course: cc.course, classroomName: cm.classroom.name, total, done });
      }
    }
  }
  const myCourses = Array.from(myCoursesMap.values());

  // Aggregate posts (recent across all classes)
  const allPosts = memberOf.flatMap(cm => cm.classroom.posts.map((p: any) => ({ ...p, classroomName: cm.classroom.name }))).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Bonjour, {session!.user.name} 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Continue ton apprentissage</p>
      </div>

      {/* Resume Card */}
      {resumeLesson && (
        <Link href={"/cours/" + resumeLesson.courseSlug + "/lecon/" + resumeLesson.id}
          className="block mb-6 bg-gradient-to-r from-brand-500 to-accent-500 rounded-2xl p-6 text-white hover:shadow-glow transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-brand-100 text-xs font-semibold uppercase tracking-wider mb-1">🎯 Reprendre où tu en étais</p>
              <p className="font-heading text-xl font-bold truncate">{resumeLesson.title}</p>
              <p className="text-brand-100 text-sm mt-1 truncate">{resumeLesson.courseTitle} · {resumeLesson.sectionTitle}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-sm font-bold shrink-0">Continuer →</div>
          </div>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard icon="📚" label="Leçons" value={completedLessons} color="brand" />
        <KPICard icon="🎯" label="Activités" value={completedActivities} color="accent" />
        <KPICard icon="📈" label="Score moyen" value={Math.round(avgScore) + "%"} color={avgScore >= 80 ? "green" : avgScore >= 50 ? "amber" : "slate"} />
        <KPICard icon="🏫" label={"Classe" + (memberOf.length > 1 ? "s" : "")} value={memberOf.length} color="slate" />
      </div>

      {/* Mes cours */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">📚 Mes cours</h2>
          <Link href="/dashboard/cours" className="text-xs font-semibold text-brand-600 hover:text-brand-800">Voir tous →</Link>
        </div>
        {myCourses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <span className="text-4xl">📖</span>
            <p className="text-slate-500 mt-3">Tu n'as pas encore de cours assignés.</p>
            <Link href="/dashboard/rejoindre" className="inline-block mt-3 text-sm font-semibold text-brand-600 bg-brand-50 px-4 py-2 rounded-lg hover:bg-brand-100 transition-colors">
              Rejoindre une classe
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.slice(0, 6).map(({ course, classroomName, total, done }) => {
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isComplete = total > 0 && done === total;
              return (
                <Link key={course.id} href={"/cours/" + course.slug} className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 shrink-0">{course.level}</span>
                    {isComplete && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Terminé</span>}
                  </div>
                  <h3 className="font-heading font-bold text-slate-900 text-base leading-tight mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-[11px] text-slate-400 mb-3">{classroomName}</p>
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={"h-full rounded-full transition-all " + (isComplete ? "bg-green-500" : "bg-brand-500")} style={{ width: pct + "%" }}></div>
                      </div>
                      <span className="text-[11px] font-bold text-slate-700">{done}/{total}</span>
                    </div>
                    <p className="text-xs font-semibold text-brand-600 mt-2">{isComplete ? "Revoir →" : "Continuer →"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Activités libres */}
      {freeActivities.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-slate-900">🎮 Activités libres</h2>
            <Link href="/activites" className="text-xs font-semibold text-brand-600 hover:text-brand-800">Toutes →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {freeActivities.map(a => {
              const t = activityTypeLabels[a.type] || { emoji: "?", label: a.type };
              return (
                <Link key={a.id} href={"/activites/" + a.id} className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all p-4 flex flex-col items-center text-center">
                  <span className="text-3xl mb-2">{t.emoji}</span>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 mb-1">{t.label}</p>
                  <p className="text-xs font-medium text-slate-700 line-clamp-2">{a.title}</p>
                  {a.level && <span className="text-[9px] font-bold mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.level}</span>}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom : Posts + Activité récente */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">📌 Nouveautés de tes classes</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {allPosts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">Aucune nouveauté.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allPosts.map((post: any) => (
                  <div key={post.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{post.title || "Publication"}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          <span className="text-brand-600 font-semibold">{post.classroomName}</span>
                          <span className="mx-1.5">·</span>
                          <span>{post.author.name}</span>
                          <span className="mx-1.5">·</span>
                          <span>{new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                        </p>
                      </div>
                    </div>
                    {post.content && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{post.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">📈 Activité récente</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {results.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">Pas encore d'activité jouée.</p>
                <Link href="/activites" className="inline-block mt-2 text-sm font-semibold text-brand-600">Jouer maintenant →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {results.map(r => {
                  const t = activityTypeLabels[r.activity.type] || { emoji: "?", label: r.activity.type };
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors">
                      <span className="text-xl">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{r.activity.title}</p>
                        <p className="text-[11px] text-slate-400">{r.completed ? "Terminé" : "En cours"}</p>
                      </div>
                      <span className={"text-xs font-bold px-2.5 py-1 rounded-full shrink-0 " + ((r.score || 0) >= 80 ? "bg-green-100 text-green-700" : (r.score || 0) >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                        {Math.round(r.score || 0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    brand: "from-brand-50 to-brand-100/50 border-brand-200",
    accent: "from-accent-50 to-accent-100/50 border-accent-200",
    green: "from-green-50 to-green-100/50 border-green-200",
    amber: "from-amber-50 to-amber-100/50 border-amber-200",
    slate: "from-slate-50 to-slate-100/50 border-slate-200",
  };
  return (
    <div className={"bg-gradient-to-br " + (colors[color] || colors.slate) + " rounded-xl p-3 border"}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-heading text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
