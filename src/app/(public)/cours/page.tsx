import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { levelColors } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 60;

export default async function CoursPage({ searchParams }: { searchParams: { level?: string } }) {
  const sp = await (searchParams as any);
  const level = sp?.level;
  const session = await getServerSession(authOptions);

  const courses = await prisma.course.findMany({
    where: { published: true, ...(level ? { level } : {}) },
    include: { author: { select: { name: true } }, sections: { include: { _count: { select: { lessons: true } } } }, _count: { select: { enrollments: true } } },
    orderBy: { createdAt: "desc" },
  });

  const enrollments = session ? await prisma.enrollment.findMany({ where: { userId: session.user.id }, select: { courseId: true } }) : [];
  const enrolledIds = new Set(enrollments.map(e => e.courseId));
  const levels = ["A1","A2","B1","B2","C1","C2"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-4xl font-bold text-brand-900">Cours de français</h1>
        <p className="text-brand-400 mt-2 text-lg">Parcourez nos cours par niveau CECRL</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Link href="/cours" className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${!level ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-glow" : "bg-white text-brand-500 border border-brand-200 hover:border-brand-300"}`}>Tous</Link>
        {levels.map(l => (
          <Link key={l} href={`/cours?level=${l}`} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${level === l ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-glow" : "bg-white text-brand-500 border border-brand-200 hover:border-brand-300"}`}>{l}</Link>
        ))}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-brand-100"><span className="text-5xl">📚</span><p className="text-brand-400 mt-4 text-lg">Aucun cours disponible.</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {courses.map(course => {
            const lessonCount = course.sections.reduce((a, s) => a + s._count.lessons, 0);
            const isEnrolled = enrolledIds.has(course.id);
            const needsCode = course.requiresEnrollment && !isEnrolled;

            return (
              <Link key={course.id} href={needsCode ? `/cours/${course.slug}/inscription` : `/cours/${course.slug}`}
                className="group bg-white rounded-2xl border border-brand-100 overflow-hidden card-hover animate-fade-in-up">
                <div className="h-36 bg-gradient-to-br from-brand-100 via-accent-50 to-brand-50 flex items-center justify-center relative">
                  <span className="text-5xl group-hover:scale-110 transition-transform">📖</span>
                  {needsCode && <div className="absolute top-3 right-3 bg-brand-600 text-white text-xs px-2 py-1 rounded-lg font-semibold">🔒 Code requis</div>}
                  {isEnrolled && <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-lg font-semibold">✅ Inscrit</div>}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${levelColors[course.level]}`}>{course.level}</span>
                    <span className="text-xs text-brand-300">{course.sections.length} section{course.sections.length !== 1 ? "s" : ""} · {lessonCount} leçon{lessonCount !== 1 ? "s" : ""}</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg text-brand-900 group-hover:text-brand-600 transition-colors">{course.title}</h3>
                  <p className="text-sm text-brand-400 mt-2 line-clamp-2">{course.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
