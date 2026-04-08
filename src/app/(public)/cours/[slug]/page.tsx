import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { levelColors } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 30;

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

  const session = await getServerSession(authOptions);
  const progressMap = new Map();
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className={"px-3 py-1 rounded-lg text-sm font-bold " + (levelColors[course.level] || "")}>{course.level}</span>
          {course.requiresEnrollment && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg">Code requis</span>}
        </div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">{course.title}</h1>
        <p className="text-slate-500 mt-2">{course.description}</p>
        <p className="text-xs text-slate-400 mt-2">Par {course.author.name} | {course._count.enrollments} inscrit(s)</p>
      </div>

      {!canAccess ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-8 text-center">
          <span className="text-4xl">{"\ud83d\udd12"}</span>
          <h2 className="font-heading text-xl font-bold text-slate-800 mt-4">Cours protege</h2>
          <p className="text-slate-400 mt-2">Ce cours necessite une inscription.</p>
          <Link href={"/cours/" + slug + "/inscription"} className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">S inscrire</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {course.sections.map((s, si) => (
            <div key={s.id} className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100">
                <h2 className="font-heading font-bold text-slate-800">Section {si + 1} - {s.title}</h2>
              </div>
              {s.lessons.length === 0 ? (
                <p className="px-6 py-6 text-center text-slate-300 text-sm">Pas encore de contenu.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {s.lessons.map((l, li) => {
                    const status = progressMap.get(l.id) || "not_started";
                    const icon = !session?.user ? "" : status === "completed" ? "\u2705" : status === "in_progress" ? "\ud83d\udd04" : "\u274c";
                    return (
                      <Link key={l.id} href={"/cours/" + slug + "/lecon/" + l.id} className="flex items-center gap-4 px-6 py-4 hover:bg-brand-50/50 transition-colors">
                        <span className="text-lg shrink-0">{icon}</span>
                        <span className="text-sm font-medium text-slate-300 w-8">{si + 1}.{li + 1}</span>
                        <p className="flex-1 font-medium text-slate-700">{l.title}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {!isEnrolled && !isMemberOfClass && session?.user && (
            <div className="text-center">
              <Link href={"/cours/" + slug + "/inscription"} className="inline-block px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">S inscrire a ce cours</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}