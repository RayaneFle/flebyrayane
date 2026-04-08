import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClassroomTabs from "./ClassroomTabs";

export default async function ClassroomDetailPage({ params }: { params: { classroomId: string } }) {
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <Link href="/admin/classes" className="text-sm text-brand-600 hover:text-brand-700 mb-1 inline-block">&#8592; Mes classes</Link>
          <h1 className="font-heading text-2xl font-bold text-slate-900">{classroom.name}</h1>
          {classroom.description && <p className="text-slate-400 mt-1 text-sm">{classroom.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <a href={"/api/classrooms/" + classroom.id + "/export"} download className="px-3 py-2 bg-green-100 text-green-700 font-bold text-xs rounded-lg hover:bg-green-200 transition-colors">Export Excel</a>
          <span className="px-3 py-2 bg-brand-100 text-brand-700 font-mono font-bold rounded-lg tracking-widest">{classroom.code}</span>
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