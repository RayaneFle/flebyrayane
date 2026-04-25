import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateClassroomForm from "./CreateForm";

export default async function AdminClassesPage() {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id || "";

  const classrooms = await prisma.classroom.findMany({
    where: { ownerId: uid },
    include: {
      _count: { select: { members: true, courses: true, activities: true, posts: true } },
      members: { select: { userId: true } },
      courses: {
        include: {
          course: {
            select: {
              id: true,
              sections: { include: { lessons: { select: { id: true, hidden: true } } } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute average progression per classroom
  const classroomStats = await Promise.all(classrooms.map(async (c) => {
    const memberIds = c.members.map(m => m.userId);
    if (memberIds.length === 0) return { classroomId: c.id, avgProgress: 0 };

    const allLessons = c.courses.flatMap(cc => cc.course.sections.flatMap(s => s.lessons.filter((l: any) => !l.hidden).map(l => l.id)));
    if (allLessons.length === 0) return { classroomId: c.id, avgProgress: 0 };

    const completed = await prisma.lessonProgress.count({
      where: {
        userId: { in: memberIds },
        lessonId: { in: allLessons },
        status: "completed",
      },
    });
    const totalPossible = memberIds.length * allLessons.length;
    return { classroomId: c.id, avgProgress: totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0 };
  }));

  const progressMap = new Map(classroomStats.map(s => [s.classroomId, s.avgProgress]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Mes classes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{classrooms.length} classe{classrooms.length > 1 ? "s" : ""}</p>
        </div>
        <CreateClassroomForm />
      </div>

      {classrooms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center mt-6">
          <span className="text-5xl">&#127979;</span>
          <h2 className="font-heading font-bold text-slate-900 mt-4">Aucune classe créée</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">Crée ta première classe pour assigner des cours, des activités et suivre la progression de tes élèves.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {classrooms.map(c => {
            const progress = progressMap.get(c.id) || 0;
            const date = new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
            return (
              <Link key={c.id} href={"/admin/classes/" + c.id} className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all p-5 group flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading font-bold text-lg text-slate-900 group-hover:text-brand-700 transition-colors leading-tight truncate">{c.name}</h3>
                    {c.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description}</p>}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Code de classe</p>
                  <div className="bg-gradient-to-r from-brand-500 to-accent-500 text-white font-mono font-bold text-lg tracking-[0.3em] px-3 py-2 rounded-lg text-center">{c.code}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div>
                    <p className="font-heading font-bold text-base text-slate-900">{c._count.members}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Élèves</p>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-base text-slate-900">{c._count.courses}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Cours</p>
                  </div>
                  <div>
                    <p className="font-heading font-bold text-base text-slate-900">{c._count.activities}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Activités</p>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={"h-full rounded-full transition-all " + (progress >= 80 ? "bg-green-500" : progress >= 40 ? "bg-amber-500" : "bg-brand-500")} style={{ width: progress + "%" }}></div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">{progress}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Progression moyenne</span>
                    <span>Créée le {date}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
