import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) redirect("/admin");
  const isAdmin = session.user.role === "admin";

  const users = await prisma.user.findMany({
    include: {
      _count: { select: { activityResults: true, enrollments: true, classroomMemberships: true, lessonProgress: true } },
      activityResults: { select: { updatedAt: true, score: true, completed: true } },
    },
  });

  const enriched = users.map(u => {
    const completed = u.activityResults.filter(r => r.completed);
    const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, r) => s + (r.score || 0), 0) / completed.length) : 0;
    const lastActivity = u.activityResults.length > 0 ? u.activityResults.map(r => r.updatedAt).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime())[0] : null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      avgScore,
      lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
      counts: u._count,
    };
  });

  return <UsersClient users={enriched} isAdmin={isAdmin} currentUserEmail={session.user.email || ""} />;
}
