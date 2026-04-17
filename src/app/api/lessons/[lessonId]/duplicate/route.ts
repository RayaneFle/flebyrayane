import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { lessonId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher"))
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  const { targetSectionId } = await request.json();
  if (!targetSectionId) return NextResponse.json({ message: "Section cible requise." }, { status: 400 });
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { blocks: { orderBy: { position: "asc" } } },
  });
  if (!lesson) return NextResponse.json({ message: "Non trouve." }, { status: 404 });
  const last = await prisma.lesson.findFirst({ where: { sectionId: targetSectionId }, orderBy: { position: "desc" } });
  const newLesson = await prisma.lesson.create({
    data: {
      title: lesson.title + " (copie)",
      content: lesson.content,
      type: lesson.type,
      position: (last?.position ?? -1) + 1,
      sectionId: targetSectionId,
      blocks: { create: lesson.blocks.map((b, i) => ({ position: i, type: b.type, content: b.content, activityId: b.activityId, requireScore: b.requireScore, minScore: b.minScore })) },
    },
  });
  return NextResponse.json(newLesson, { status: 201 });
}
