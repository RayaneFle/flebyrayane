import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import ClassroomTabs from "./ClassroomTabs";
import ClassroomActionsMenu from "./ClassroomActionsMenu";

export default async function ClassroomDetailPage({ params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const isAdmin = session.user.role === "admin";

  const classroom = await prisma.classroom.findUnique({
    where: { id: params.classroomId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { joinedAt: "desc" } },
      subclasses: { orderBy: { createdAt: "asc" } },
      courses: { include: { course: { select: { id: true, title: true, slug: true, level: true } } } },
      activities: { include: { activity: { select: { id: true, title: true, type: true, level: true } } } },
      posts: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!classroom) notFound();
  if (!isAdmin && classroom.ownerId !== session.user.id) notFound();

  const allCourses = await prisma.course.findMany({ where: { published: true }, select: { id: true, title: true, level: true } });
  const assignedCourseIds = new Set(classroom.courses.map(c => c.courseId));
  const availableCourses = allCourses.filter(c => !assignedCourseIds.has(c.id));

  const allActivities = await prisma.activity.findMany({ where: { isPublic: true }, select: { id: true, title: true, type: true, level: true } });
  const assignedActivityIds = new Set(classroom.activities.map(a => a.activityId));
  const availableActivities = allActivities.filter(a => !assignedActivityIds.has(a.id));

  const [allLessonProgress, studentResults, assignedCourseLessons] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { userId: { in: classroom.members.map(m => m.userId) } },
      include: { lesson: { select: { id: true, title: true } } },
    }),
    prisma.activityResult.findMany({
      where: { userId: { in: classroom.members.map(m => m.userId) }, completed: true },
      include: { user: { select: { id: true, name: true } }, activity: { select: { id: true, title: true, type: true } } },
    }),
    prisma.lesson.findMany({
      where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
      select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } },
      orderBy: { position: "asc" },
    }),
  ]);

  const allLessonsForTracking = assignedCourseLessons.map(l => ({
    id: l.id, title: l.title, sectionTitle: l.section.title, courseTitle: l.section.course.title,
  }));

  // Compute aggregate stats
  const totalStudents = classroom.members.length;
  const totalLessons = allLessonsForTracking.length;
  const completedByStudent = new Map<string, number>();
  for (const p of allLessonProgress) {
    if (p.status === "completed") {
      completedByStudent.set(p.userId, (completedByStudent.get(p.userId) || 0) + 1);
    }
  }
  const totalCompleted = Array.from(completedByStudent.values()).reduce((a, b) => a + b, 0);
  const maxCompleted = totalStudents * totalLessons;
  const completionRate = maxCompleted > 0 ? Math.round((totalCompleted / maxCompleted) * 100) : 0;

  const scoresByStudent = new Map<string, { sum: number; count: number }>();
  for (const r of studentResults) {
    const s = scoresByStudent.get(r.userId) || { sum: 0, count: 0 };
    s.sum += r.score || 0;
    s.count += 1;
    scoresByStudent.set(r.userId, s);
  }
  const avgScores = Array.from(scoresByStudent.values()).map(s => s.sum / s.count);
  const globalAvg = avgScores.length > 0 ? Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length) : 0;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/admin/classes" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">
          ← Mes classes
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-2xl font-bold text-slate-900 truncate">{classroom.name}</h1>
            {classroom.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{classroom.description}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={"/api/classrooms/" + classroom.id + "/export"} download className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors">
              📊 Export Excel
            </a>
            <div className="bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-lg px-4 py-2">
              <p className="text-[9px] uppercase tracking-wider text-white/80 font-semibold">Code classe</p>
              <p className="font-mono font-bold text-base tracking-widest">{classroom.code}</p>
            </div>
            <ClassroomActionsMenu classroomId={classroom.id} classroomName={classroom.name} />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon="👥" label="Élèves" value={totalStudents} gradient="from-brand-50 to-brand-100/50" />
          <StatCard icon="📚" label="Cours" value={classroom.courses.length} gradient="from-accent-50 to-accent-100/50" />
          <StatCard icon="🎮" label="Activités" value={classroom.activities.length} gradient="from-green-50 to-green-100/50" />
          <StatCard icon="📈" label="Progression" value={completionRate + "%"} gradient="from-amber-50 to-amber-100/50" subtitle={"Score moyen: " + globalAvg + "%"} />
        </div>
      </div>

      <ClassroomTabs
        classroom={JSON.parse(JSON.stringify(classroom))}
        availableCourses={availableCourses}
        availableActivities={availableActivities}
        allLessonProgress={JSON.parse(JSON.stringify(allLessonProgress))}
        studentResults={JSON.parse(JSON.stringify(studentResults))}
        allLessonsForTracking={allLessonsForTracking}
      />
    </div>
  );
}

function StatCard({ icon, label, value, gradient, subtitle }: { icon: string; label: string; value: string | number; gradient: string; subtitle?: string }) {
  return (
    <div className={"bg-gradient-to-br " + gradient + " rounded-xl p-3 border border-slate-100"}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-heading text-xl font-bold text-slate-900">{value}</p>
      {subtitle && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
    </div>
  );
}
