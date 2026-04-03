import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_r: Request, { params }: { params: { courseId: string; sectionId: string; lessonId: string } }) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { blocks: { orderBy: { position: "asc" }, include: { activity: { select: { id: true, title: true, type: true, config: true } } } } },
  });
  if (!lesson) return NextResponse.json({ message: "Non trouve." }, { status: 404 });
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
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  const { title, blocks } = await request.json();
  await prisma.lessonBlock.deleteMany({ where: { lessonId: params.lessonId } });
  const lesson = await prisma.lesson.update({
    where: { id: params.lessonId },
    data: {
      ...(title ? { title } : {}),
      blocks: { create: (blocks || []).map((b: any, i: number) => ({ position: i, type: b.type, content: b.content || null, activityId: b.activityId || null, requireScore: b.requireScore || false, minScore: b.minScore || 60 })) },
    },
  });
  return NextResponse.json(lesson);
}