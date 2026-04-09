import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { courseId: string; sectionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (!title) return NextResponse.json({ message: "Titre requis." }, { status: 400 });
  const last = await prisma.lesson.findFirst({ where: { sectionId: params.sectionId }, orderBy: { position: "desc" } });
  const lesson = await prisma.lesson.create({
    data: {
      title, type: "MIXED", position: (last?.position ?? -1) + 1, sectionId: params.sectionId,
      blocks: { create: (blocks || []).map((b: any, i: number) => ({ position: i, type: b.type, content: b.content || null, activityId: b.activityId || null, requireScore: b.requireScore || false, minScore: b.minScore || 60 })) },
    },
  });
  return NextResponse.json(lesson, { status: 201 });
}
