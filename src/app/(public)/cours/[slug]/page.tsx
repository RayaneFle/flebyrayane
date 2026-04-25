import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { levelColors } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 30;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    select: { title: true, description: true, level: true },
  });
  if (!course) return { title: "Cours introuvable" };
  const shortDesc = course.description.length > 160 ? course.description.slice(0, 157) + "..." : course.description;
  return {
    title: course.title + " — Niveau " + course.level,
    description: shortDesc,
    openGraph: {
      title: course.title + " | FLE by Rayane",
      description: shortDesc,
    },
  };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true } },
      sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" } } } },
      _count: { select: { enrollments: true } },
    },
  });
  if (!course) notFound();

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "EducationalOrganization",
      "name": "FLE by Rayane",
      "sameAs": "https://flebyrayane.vercel.app",
    },
    "inLanguage": "fr",
    "educationalLevel": course.level,
    "isAccessibleForFree": !course.requiresEnrollment,
  };

  const session = await getServerSession(authOptions);
  const progressMap = new Map<string, string>();
  if (session?.user) {
    const progress = await prisma.lessonProgress.findMany({
      where: { userId: session.user.id, lessonId: { in: course.sections.flatMap(s => s.lessons.map(l => l.id)) } },
    });
    progress.forEach(p => progressMap.set(p.lessonId, p.status));
  }

  const isEnrolled = session?.user ? await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  }) : null;

  const isMemberOfClass = session?.user ? await prisma.classroomCourse.findFirst({
    where: { courseId: course.id, classroom: { members: { some: { userId: session.user.id } } } },
  }) : null;

  const canAccess = !course.requiresEnrollment || isEnrolled || isMemberOfClass;

  const totalLessons = course.sections.reduce((s, sec) => s + sec.lessons.filter((l: any) => !l.hidden).length, 0);
  const completedLessons = session?.user ? course.sections.reduce((s, sec) => s + sec.lessons.filter(l => progressMap.get(l.id) === "completed").length, 0) : 0;
  const overallProgress = totalLessons > 0 ? Math.round(completedLessons / totalLessons * 100) : 0;

  // Find next lesson to do (in_progress first, then first not_started)
  let nextLesson: { id: string; title: string; sectionTitle: string; sectionIdx: number; lessonIdx: number; status: string } | null = null;
  if (session?.user) {
    outer: for (let si = 0; si < course.sections.length; si++) {
      const s = course.sections[si];
      const visible = s.lessons.filter((l: any) => !l.hidden);
      for (let li = 0; li < visible.length; li++) {
        const l = visible[li];
        if (progressMap.get(l.id) === "in_progress") {
          nextLesson = { id: l.id, title: l.title, sectionTitle: s.title, sectionIdx: si, lessonIdx: li, status: "in_progress" };
          break outer;
        }
      }
    }
    if (!nextLesson) {
      outer2: for (let si = 0; si < course.sections.length; si++) {
        const s = course.sections[si];
        const visible = s.lessons.filter((l: any) => !l.hidden);
        for (let li = 0; li < visible.length; li++) {
          const l = visible[li];
          if (progressMap.get(l.id) !== "completed") {
            nextLesson = { id: l.id, title: l.title, sectionTitle: s.title, sectionIdx: si, lessonIdx: li, status: "not_started" };
            break outer2;
          }
        }
      }
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/cours" className="hover:text-brand-600">Cours</Link>
        <span>/</span>
        <span className="text-slate-600 font-medium truncate">{course.title}</span>
      </div>

      {/* Header card */}
      <div className="bg-gradient-to-br from-brand-600 to-accent-500 rounded-2xl p-6 sm:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-lg text-sm font-bold">{course.level}</span>
            <span className="text-brand-100 text-sm">{totalLessons} leçon{totalLessons > 1 ? "s" : ""}</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold">{course.title}</h1>
          <p className="text-brand-100 mt-2 text-sm">{course.description}</p>
          <p className="text-brand-200 text-xs mt-3">Par {course.author.name}</p>

          {session?.user && totalLessons > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-brand-100">Progression</span>
                <span className="text-xs font-bold">{overallProgress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{width: overallProgress + "%"}} />
              </div>
              <p className="text-[10px] text-brand-200 mt-1">{completedLessons}/{totalLessons} leçons terminées</p>
            </div>
          )}

          {nextLesson && canAccess && (
            <Link href={"/cours/" + slug + "/lecon/" + nextLesson.id} className="mt-5 inline-flex items-center gap-3 bg-white text-brand-700 font-semibold rounded-xl px-5 py-3 hover:bg-brand-50 hover:shadow-lg transition-all">
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-wider text-brand-500 font-bold">{nextLesson.status === "in_progress" ? "Reprendre" : completedLessons === 0 ? "Commencer" : "Continuer"}</p>
                <p className="text-sm font-bold truncate max-w-[260px]">{nextLesson.sectionIdx + 1}.{nextLesson.lessonIdx + 1} {nextLesson.title}</p>
              </div>
              <span className="text-2xl shrink-0">&rarr;</span>
            </Link>
          )}

          {!nextLesson && session?.user && completedLessons === totalLessons && totalLessons > 0 && canAccess && (
            <div className="mt-5 inline-flex items-center gap-3 bg-green-500/30 backdrop-blur text-white font-semibold rounded-xl px-5 py-3 border border-white/30">
              <span className="text-2xl">&#127881;</span>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/80 font-bold">Bravo</p>
                <p className="text-sm font-bold">Cours terminé !</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {!canAccess ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-8 text-center">
          <span className="text-5xl">🔒</span>
          <h2 className="font-heading text-xl font-bold text-slate-800 mt-4">Cours protégé</h2>
          <p className="text-slate-400 mt-2">Ce cours nécessite une inscription.</p>
          <Link href={"/cours/" + slug + "/inscription"} className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">S'inscrire</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {course.sections.map((s, si) => {
            const visibleLessons = s.lessons.filter((l: any) => !l.hidden);
            const sectionDone = visibleLessons.filter(l => progressMap.get(l.id) === "completed").length;
            const sectionProgress = visibleLessons.length > 0 ? Math.round(sectionDone / visibleLessons.length * 100) : 0;

            return (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-bold text-slate-900">{s.title}</h2>
                    {session?.user && s.lessons.length > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{width: sectionProgress + "%"}} />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{sectionDone}/{s.lessons.length}</span>
                      </div>
                    )}
                  </div>
                </div>
                {s.lessons.length === 0 ? (
                  <p className="px-6 py-8 text-center text-slate-300 text-sm">Bientôt disponible</p>
                ) : (
                  <div>
                    {s.lessons.filter((l: any) => !l.hidden).map((l, li) => {
                      const status = progressMap.get(l.id) || "not_started";
                      return (
                        <Link key={l.id} href={"/cours/" + slug + "/lecon/" + l.id}
                          className="flex items-center gap-4 px-6 py-3.5 hover:bg-brand-50/30 transition-colors border-b border-slate-50 last:border-0">
                          {session?.user ? (
                            <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 " +
                              (status === "completed" ? "bg-green-500 text-white" :
                               status === "in_progress" ? "bg-amber-400 text-white" :
                               "bg-slate-100 text-slate-400")}>
                              {status === "completed" ? "\u2713" : status === "in_progress" ? "..." : (li + 1)}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-brand-100 text-brand-600">
                              {li + 1}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={"font-medium text-sm " + (status === "completed" ? "text-green-700" : "text-slate-700")}>{l.title}</p>
                          </div>
                          {status === "completed" && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">Fait</span>}
                          {status === "in_progress" && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">En cours</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}