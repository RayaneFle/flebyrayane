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
      section: { include: { course: { select: { title: true, slug: true } }, lessons: { orderBy: { position: "asc" }, select: { id: true, title: true } } } },
      blocks: { orderBy: { position: "asc" }, include: { activity: { select: { id: true, title: true, type: true, config: true, level: true } } } },
    },
  });
  if (!lesson || lesson.section.course.slug !== slug) notFound();
  if ((lesson as any).hidden && !isTeacher) notFound();

  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true, requiresEnrollment: true, authorId: true } });
  if (!course) notFound();
  if (!isTeacher && course.authorId !== session.user.id && course.requiresEnrollment) {
    const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: session.user.id, courseId: course.id } } });
    if (!enrollment) redirect("/cours/" + slug + "/inscription");
  }

  const publishAt = (lesson as any).publishAt;
  if (publishAt && new Date(publishAt) > new Date() && !isTeacher) notFound();

  const lessonsInSection = lesson.section.lessons.filter((l: any) => !(l as any).hidden);
  const idx = lessonsInSection.findIndex(l => l.id === lessonId);
  const prev = idx > 0 ? lessonsInSection[idx - 1] : null;
  const next = idx < lessonsInSection.length - 1 ? lessonsInSection[idx + 1] : null;

  const blocksWithParsedConfig = lesson.blocks.map(b => ({
    ...b,
    activity: b.activity ? { ...b.activity, config: typeof b.activity.config === "string" ? JSON.parse(b.activity.config) : b.activity.config } : null,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-brand-400 mb-6">
        <Link href="/cours" className="hover:text-brand-600">Cours</Link><span>/</span>
        <Link href={`/cours/${slug}`} className="hover:text-brand-600">{lesson.section.course.title}</Link><span>/</span>
        <span className="text-brand-600 font-medium">{lesson.title}</span>
      </div>
      <div className="bg-white rounded-2xl border border-brand-100 p-6 mb-6">
        <p className="text-xs text-brand-400 mb-1">{lesson.section.title}</p>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-brand-900">{lesson.title}</h1>
      </div>
      <LessonContent blocks={blocksWithParsedConfig} lessonId={params.lessonId} nextLessonUrl={next ? "/cours/" + slug + "/lecon/" + next.id : undefined} courseUrl={"/cours/" + slug} />
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-brand-100">
        {prev ? <Link href={`/cours/${slug}/lecon/${prev.id}`} className="text-sm font-medium text-brand-500 hover:text-brand-700">← {prev.title}</Link> : <div />}
        {next ? <Link href={`/cours/${slug}/lecon/${next.id}`} className="text-sm font-medium text-accent-600 hover:text-accent-700">{next.title} →</Link> : <Link href={`/cours/${slug}`} className="text-sm font-medium text-green-600">✅ Retour au cours</Link>}
      </div>
    </div>
  );
}
