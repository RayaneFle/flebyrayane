import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CoursesClient from "./CoursesClient";

export default async function AdminCoursPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) redirect("/admin");
  const uid = session.user.id;
  const isAdmin = session.user.role === "admin";

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      level: true,
      enrollmentCode: true,
      authorId: true,
      author: { select: { id: true, name: true } },
      sections: { select: { id: true } },
      _count: { select: { enrollments: true } },
    },
  });

  // Normalize + split
  const normalized = courses.map(c => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    level: c.level,
    enrollmentCode: c.enrollmentCode,
    author: { id: c.author.id, name: c.author.name },
    sectionsCount: c.sections.length,
    enrollmentsCount: c._count.enrollments,
  }));

  const myCourses = normalized.filter(c => c.author.id === uid);
  const otherCourses = isAdmin ? normalized.filter(c => c.author.id !== uid) : [];

  return <CoursesClient myCourses={myCourses} otherCourses={otherCourses} isAdmin={isAdmin} currentUserId={uid} />;
}
