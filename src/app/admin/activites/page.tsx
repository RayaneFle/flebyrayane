import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ActivitiesClient from "./ActivitiesClient";

export default async function AdminActivitesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) redirect("/admin");
  const uid = session.user.id;
  const isAdmin = session.user.role === "admin";

  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      level: true,
      isPublic: true,
      createdBy: { select: { id: true, name: true } },
      _count: { select: { results: true } },
    },
  });

  const normalized = activities.map(a => ({
    id: a.id,
    title: a.title,
    type: a.type,
    level: a.level,
    isPublic: a.isPublic,
    createdBy: { id: a.createdBy.id, name: a.createdBy.name },
    resultsCount: a._count.results,
  }));

  const myActivities = normalized.filter(a => a.createdBy.id === uid);
  const otherActivities = isAdmin ? normalized.filter(a => a.createdBy.id !== uid) : [];

  return <ActivitiesClient myActivities={myActivities} otherActivities={otherActivities} isAdmin={isAdmin} currentUserId={uid} />;
}
