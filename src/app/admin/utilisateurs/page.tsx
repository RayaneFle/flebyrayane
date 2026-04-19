import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) redirect("/admin");
  const isAdmin = session.user.role === "admin";

  // Teachers only see students in their classes
  let userFilter: any = {};
  if (!isAdmin) {
    const teacherClasses = await prisma.classroom.findMany({
      where: { ownerId: session.user.id },
      select: { members: { select: { userId: true } } },
    });
    const studentIds = Array.from(new Set(teacherClasses.flatMap(c => c.members.map(m => m.userId))));
    userFilter = { id: { in: studentIds } };
  }

  // Fetch all classes (for admin filter dropdown)
  const allClasses = isAdmin ? await prisma.classroom.findMany({
    select: { id: true, name: true, code: true, members: { select: { userId: true } } },
    orderBy: { createdAt: "desc" },
  }) : [];

  const users = await prisma.user.findMany({
    where: userFilter,
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      _count: { select: { activityResults: true, enrollments: true, classroomMemberships: true, lessonProgress: true } },
      classroomMemberships: { select: { classroomId: true } },
    },
  });

  // Aggregate stats per user (avgScore + lastActivity + lessonsCompleted) in parallel queries
  const userIds = users.map(u => u.id);
  const [scoreAggs, lastActivities, lessonsCompletedPerUser] = await Promise.all([
    userIds.length > 0 ? prisma.activityResult.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, completed: true },
      _avg: { score: true },
    }) : Promise.resolve([]),
    userIds.length > 0 ? prisma.activityResult.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _max: { updatedAt: true },
    }) : Promise.resolve([]),
    userIds.length > 0 ? prisma.lessonProgress.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: "completed" },
      _count: { _all: true },
    }) : Promise.resolve([]),
  ]);

  // Fetch last 5 activities per user + list of courses they have access to
  const [recentActivitiesPerUser, coursesPerUser] = await Promise.all([
    userIds.length > 0 ? prisma.activityResult.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        score: true,
        completed: true,
        updatedAt: true,
        activity: { select: { title: true, type: true, level: true } },
      },
      orderBy: { updatedAt: "desc" },
    }) : Promise.resolve([]),
    userIds.length > 0 ? prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        enrollments: { select: { course: { select: { id: true, title: true, level: true, slug: true } } } },
        classroomMemberships: {
          select: {
            classroom: {
              select: {
                name: true,
                courses: { select: { course: { select: { id: true, title: true, level: true, slug: true } } } },
              },
            },
          },
        },
      },
    }) : Promise.resolve([]),
  ]);

  // Regroup recent activities per user (max 5 per user)
  const recentActivitiesMap = new Map<string, { title: string; type: string; level: string | null; score: number | null; completed: boolean; updatedAt: string }[]>();
  for (const r of recentActivitiesPerUser) {
    const arr = recentActivitiesMap.get(r.userId) || [];
    if (arr.length < 5) {
      arr.push({
        title: r.activity.title,
        type: r.activity.type,
        level: r.activity.level,
        score: r.score,
        completed: r.completed,
        updatedAt: r.updatedAt.toISOString(),
      });
      recentActivitiesMap.set(r.userId, arr);
    }
  }

  // Regroup courses per user (unique, from enrollments + classes)
  const coursesMap = new Map<string, { id: string; title: string; level: string; slug: string; source: string }[]>();
  for (const u of coursesPerUser) {
    const seen = new Set<string>();
    const courses: { id: string; title: string; level: string; slug: string; source: string }[] = [];
    for (const e of u.enrollments) {
      if (!seen.has(e.course.id)) {
        seen.add(e.course.id);
        courses.push({ ...e.course, source: "Inscrit" });
      }
    }
    for (const m of u.classroomMemberships) {
      for (const cc of m.classroom.courses) {
        if (!seen.has(cc.course.id)) {
          seen.add(cc.course.id);
          courses.push({ ...cc.course, source: m.classroom.name });
        }
      }
    }
    coursesMap.set(u.id, courses);
  }

  // Build courseIds per user from coursesPerUser (already fetched) - NO extra query
  const courseIdsPerUser = new Map<string, Set<string>>();
  for (const u of coursesPerUser) {
    const ids = new Set<string>();
    for (const e of u.enrollments) ids.add(e.course.id);
    for (const m of u.classroomMemberships) for (const cc of m.classroom.courses) ids.add(cc.course.id);
    courseIdsPerUser.set(u.id, ids);
  }

  // Count lessons per course ONCE (aggregate query)
  const allCourseIds = Array.from(new Set(Array.from(courseIdsPerUser.values()).flatMap(s => Array.from(s))));
  const lessonsByCourse = allCourseIds.length > 0 ? await prisma.lesson.groupBy({
    by: ["sectionId"],
    where: { section: { courseId: { in: allCourseIds } } },
    _count: { _all: true },
  }) : [];

  // Get sectionId -> courseId mapping (for the lesson groupBy)
  const sections = allCourseIds.length > 0 ? await prisma.section.findMany({
    where: { courseId: { in: allCourseIds } },
    select: { id: true, courseId: true },
  }) : [];
  const sectionToCourse = new Map(sections.map(s => [s.id, s.courseId]));

  // lessonsByCourse: courseId -> count
  const lessonsCountByCourse = new Map<string, number>();
  for (const l of lessonsByCourse) {
    const cid = sectionToCourse.get(l.sectionId);
    if (cid) lessonsCountByCourse.set(cid, (lessonsCountByCourse.get(cid) || 0) + l._count._all);
  }

  // Now compute totalLessons per user by summing lesson counts of their courses
  const totalLessonsMap = new Map<string, number>();
  for (const [userId, courseIds] of courseIdsPerUser.entries()) {
    let total = 0;
    for (const cid of courseIds) total += lessonsCountByCourse.get(cid) || 0;
    totalLessonsMap.set(userId, total);
  }

  const scoreMap = new Map(scoreAggs.map(s => [s.userId, s._avg.score]));
  const lastActivityMap = new Map(lastActivities.map(l => [l.userId, l._max.updatedAt]));
  const lessonsCompletedMap = new Map(lessonsCompletedPerUser.map(l => [l.userId, l._count._all]));

  const enriched = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    avgScore: Math.round(scoreMap.get(u.id) || 0),
    lastActivity: lastActivityMap.get(u.id) ? new Date(lastActivityMap.get(u.id)!).toISOString() : null,
    counts: u._count,
    lessonsCompleted: lessonsCompletedMap.get(u.id) || 0,
    lessonsTotal: totalLessonsMap.get(u.id) || 0,
    classroomIds: u.classroomMemberships.map(m => m.classroomId),
    recentActivities: recentActivitiesMap.get(u.id) || [],
    courses: coursesMap.get(u.id) || [],
  }));

  const classrooms = allClasses.map(c => ({ id: c.id, name: c.name, code: c.code, memberCount: c.members.length }));

  return <UsersClient users={enriched} isAdmin={isAdmin} currentUserEmail={session.user.email || ""} classrooms={classrooms} />;
}
