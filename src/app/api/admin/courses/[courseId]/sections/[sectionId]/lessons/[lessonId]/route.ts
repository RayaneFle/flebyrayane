import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditLesson } from "@/lib/authz";

export async function GET(_r: Request, { params }: { params: { courseId: string; sectionId: string; lessonId: string } }) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { blocks: { orderBy: { position: "asc" }, include: { activity: { select: { id: true, title: true, type: true, config: true } } } } },
  });
  if (!lesson) return NextResponse.json({ message: "Non trouvé." }, { status: 404 });
  return NextResponse.json({
    ...lesson,
    blocks: lesson.blocks.map(b => ({
      ...b,
      activity: b.activity ? { ...b.activity, config: typeof b.activity.config === "string" ? JSON.parse(b.activity.config) : b.activity.config } : null,
    })),
  });
}

export async function PUT(request: Request, { params }: { params: { courseId: string; sectionId: string; lessonId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const allowed = await canEditLesson(params.lessonId, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const { title, blocks } = await request.json();
  if (blocks && !Array.isArray(blocks)) {
    return NextResponse.json({ message: "Format invalide." }, { status: 400 });
  }
  const lesson = await prisma.$transaction(async (tx) => {
    await tx.lessonBlock.deleteMany({ where: { lessonId: params.lessonId } });
    return await tx.lesson.update({
      where: { id: params.lessonId },
      data: {
        ...(title ? { title } : {}),
        blocks: { create: (blocks || []).map((b: any, i: number) => ({
          position: i, type: b.type, content: b.content || null,
          activityId: b.activityId || null,
          requireScore: b.requireScore || false,
          minScore: b.minScore || 60,
        })) },
      },
    });
  });
  return NextResponse.json(lesson);
}

export async function DELETE(_r: Request, { params }: { params: { courseId: string; sectionId: string; lessonId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const allowed = await canEditLesson(params.lessonId, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  await prisma.lesson.delete({ where: { id: params.lessonId } });
  return NextResponse.json({ success: true });
}
