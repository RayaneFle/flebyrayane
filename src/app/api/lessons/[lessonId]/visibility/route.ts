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
  const lesson = await prisma.lesson.update({ where: { id: params.lessonId }, data: { hidden: Boolean(hidden) } });
  return NextResponse.json(lesson);
}
