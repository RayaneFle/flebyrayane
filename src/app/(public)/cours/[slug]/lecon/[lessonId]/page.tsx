import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import LessonContent from "./LessonContent";

export default async function LessonPage({ params }: { params: { slug: string; lessonId: string } }) {
  const { slug, lessonId } = params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/cours/" + slug + "/lecon/" + lessonId);
  const isTeacher = session.user.role === "admin" || session.user.role === "teacher";

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: {
          course: {
            select: {
              id: true, title: true, slug: true, level: true, requiresEnrollment: true, authorId: true,
              sections: {
                orderBy: { position: "asc" },
                include: { lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, hidden: true, publishAt: true } } },
              },
            },
          },
          lessons: { orderBy: { position: "asc" }, select: { id: true, title: true } },
        },
      },
      blocks: { orderBy: { position: "asc" }, include: { activity: { select: { id: true, title: true, type: true, config: true, level: true } } } },
    },
  });
  if (!lesson || lesson.section.course.slug !== slug) notFound();
  if ((lesson as any).hidden && !isTeacher) notFound();

  const course = lesson.section.course;
  if (!isTeacher && course.authorId !== session.user.id && course.requiresEnrollment) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    });
    if (!enrollment) redirect("/cours/" + slug + "/inscription");
  }

  const publishAt = (lesson as any).publishAt;
  if (publishAt && new Date(publishAt) > new Date() && !isTeacher) notFound();

  // Get progress for sidebar (which lessons are done)
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id, lesson: { section: { courseId: course.id } } },
    select: { lessonId: true, status: true },
  });
  const progressMap = new Map(progress.map(p => [p.lessonId, p.status]));

  const lessonsInSection = lesson.section.lessons.filter((l: any) => !(l as any).hidden);
  const idx = lessonsInSection.findIndex(l => l.id === lessonId);
  const prev = idx > 0 ? lessonsInSection[idx - 1] : null;
  const next = idx < lessonsInSection.length - 1 ? lessonsInSection[idx + 1] : null;

  const blocksWithParsedConfig = lesson.blocks.map(b => ({
    ...b,
    activity: b.activity ? { ...b.activity, config: typeof b.activity.config === "string" ? JSON.parse(b.activity.config) : b.activity.config } : null,
  }));

  // Stats for header
  const allLessonsInCourse = course.sections.flatMap((s: any) => s.lessons.filter((l: any) => !l.hidden));
  const totalCourseLessons = allLessonsInCourse.length;
  const doneCourseLessons = allLessonsInCourse.filter((l: any) => progressMap.get(l.id) === "completed").length;
  const currentLessonStatus = progressMap.get(lessonId) || "not_started";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
        <Link href="/dashboard" className="hover:text-brand-600 transition-colors">Tableau de bord</Link>
        <span className="text-slate-300">/</span>
        <Link href={"/cours/" + slug} className="hover:text-brand-600 transition-colors truncate max-w-[180px]">{course.title}</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium truncate">{lesson.title}</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        {/* Main column */}
        <div className="min-w-0">
          {/* Header card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">{course.level}</span>
              <span className="text-[11px] font-semibold text-slate-500">{lesson.section.title}</span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] font-semibold text-slate-500">Leçon {idx + 1}/{lessonsInSection.length}</span>
              {currentLessonStatus === "completed" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Terminée</span>
              )}
              {currentLessonStatus === "in_progress" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">En cours</span>
              )}
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{lesson.title}</h1>
          </div>

          {/* Lesson content */}
          <LessonContent
            blocks={blocksWithParsedConfig}
            lessonId={lessonId}
            nextLessonUrl={next ? "/cours/" + slug + "/lecon/" + next.id : undefined}
            courseUrl={"/cours/" + slug}
          />

          {/* Footer navigation */}
          <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-3">
            {prev ? (
              <Link href={"/cours/" + slug + "/lecon/" + prev.id} className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4 group">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">← Leçon précédente</p>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-brand-700 transition-colors truncate">{prev.title}</p>
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link href={"/cours/" + slug + "/lecon/" + next.id} className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4 group text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Leçon suivante →</p>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-brand-700 transition-colors truncate">{next.title}</p>
              </Link>
            ) : (
              <Link href={"/cours/" + slug} className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white p-4 text-right hover:shadow-glow transition-all">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1">Fin de section</p>
                <p className="text-sm font-bold">✓ Retour au cours</p>
              </Link>
            )}
          </div>
        </div>

        {/* Sidebar - Plan du cours */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 bg-white rounded-2xl border border-slate-200 p-5 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="mb-4">
              <h2 className="font-heading font-bold text-slate-900 text-sm">📚 Plan du cours</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: (totalCourseLessons > 0 ? doneCourseLessons / totalCourseLessons * 100 : 0) + "%" }}></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{doneCourseLessons}/{totalCourseLessons}</span>
              </div>
            </div>
            <div className="space-y-3">
              {course.sections.map((s: any, si: number) => {
                const visibleLessons = s.lessons.filter((l: any) => !l.hidden);
                if (visibleLessons.length === 0) return null;
                const isCurrentSection = s.id === lesson.section.id;
                return (
                  <div key={s.id}>
                    <p className={"text-[10px] font-bold uppercase tracking-wider mb-1.5 " + (isCurrentSection ? "text-brand-700" : "text-slate-400")}>
                      {si + 1}. {s.title}
                    </p>
                    <div className="space-y-0.5">
                      {visibleLessons.map((l: any, li: number) => {
                        const status = progressMap.get(l.id) || "not_started";
                        const isCurrent = l.id === lessonId;
                        return (
                          <Link
                            key={l.id}
                            href={"/cours/" + slug + "/lecon/" + l.id}
                            className={"flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors " + (isCurrent ? "bg-brand-50 text-brand-700 font-semibold border border-brand-200" : "text-slate-600 hover:bg-slate-50")}
                          >
                            <span className={"shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold " + (status === "completed" ? "bg-green-500 text-white" : status === "in_progress" ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500")}>
                              {status === "completed" ? "✓" : si + 1 + "." + (li + 1)}
                            </span>
                            <span className="truncate">{l.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
