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

  // For each user, count total available lessons (across their enrolled courses AND their class courses)
  const totalLessonsMap = new Map<string, number>();
  await Promise.all(users.map(async (u) => {
    const [enrolledCourses, classCourses] = await Promise.all([
      prisma.enrollment.findMany({ where: { userId: u.id }, select: { courseId: true } }),
      prisma.classroomMember.findMany({
        where: { userId: u.id },
        select: { classroom: { select: { courses: { select: { courseId: true } } } } },
      }),
    ]);
    const courseIds = new Set([
      ...enrolledCourses.map(e => e.courseId),
      ...classCourses.flatMap(m => m.classroom.courses.map(c => c.courseId)),
    ]);
    if (courseIds.size === 0) { totalLessonsMap.set(u.id, 0); return; }
    const total = await prisma.lesson.count({
      where: { section: { courseId: { in: Array.from(courseIds) } } },
    });
    totalLessonsMap.set(u.id, total);
  }));

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
  }));

  const classrooms = allClasses.map(c => ({ id: c.id, name: c.name, code: c.code, memberCount: c.members.length }));

  return <UsersClient users={enriched} isAdmin={isAdmin} currentUserEmail={session.user.email || ""} classrooms={classrooms} />;
}
