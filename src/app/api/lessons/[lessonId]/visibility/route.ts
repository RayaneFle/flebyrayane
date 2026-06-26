import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditLesson } from "@/lib/authz";

export async function PUT(request: Request, { params }: { params: { lessonId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const allowed = await canEditLesson(params.lessonId, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });

  const { hidden } = await request.json();

  // Mettre à jour la visibilité de la leçon
  const lesson = await prisma.lesson.update({ where: { id: params.lessonId }, data: { hidden: Boolean(hidden) } });

  // Mettre à jour les activités liées à cette leçon
  const blocks = await prisma.lessonBlock.findMany({
    where: { lessonId: params.lessonId, activityId: { not: null } },
    select: { activityId: true },
  });
  const activityIds = [...new Set(blocks.map(b => b.activityId).filter(Boolean))] as string[];
  if (activityIds.length > 0) {
    await prisma.activity.updateMany({
      where: { id: { in: activityIds } },
      data: { isPublic: !hidden },
    });
  }

  return NextResponse.json(lesson);
}
