import { prisma } from "@/lib/prisma";

export async function canEditCourse(courseId: string, userId: string, role: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, authorId: true },
  });
  if (!course) return null;
  if (role === "admin" || course.authorId === userId) return course;
  return null;
}

export async function canEditActivity(activityId: string, userId: string, role: string) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    select: { id: true, createdById: true },
  });
  if (!activity) return null;
  if (role === "admin" || activity.createdById === userId) return activity;
  return null;
}

export async function canEditClassroom(classroomId: string, userId: string, role: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, ownerId: true },
  });
  if (!classroom) return null;
  if (role === "admin" || classroom.ownerId === userId) return classroom;
  return null;
}

export async function canEditLesson(lessonId: string, userId: string, role: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      sectionId: true,
      section: { select: { courseId: true, course: { select: { authorId: true } } } },
    },
  });
  if (!lesson) return null;
  if (role === "admin" || lesson.section.course.authorId === userId) return lesson;
  return null;
}

export async function canEditSection(sectionId: string, userId: string, role: string) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { id: true, courseId: true, course: { select: { authorId: true } } },
  });
  if (!section) return null;
  if (role === "admin" || section.course.authorId === userId) return section;
  return null;
}

export async function canViewClassroom(classroomId: string, userId: string, role: string) {
  if (role === "admin") {
    const c = await prisma.classroom.findUnique({ where: { id: classroomId }, select: { id: true } });
    return c;
  }
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, ownerId: true, members: { where: { userId }, select: { id: true } } },
  });
  if (!classroom) return null;
  if (classroom.ownerId === userId || classroom.members.length > 0) return classroom;
  return null;
}
