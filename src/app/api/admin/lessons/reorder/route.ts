import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReorderSchema = z.object({
  lessonId: z.string().min(1),
  direction: z.enum(["up", "down"]),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
      return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ReorderSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ message: "Données invalides." }, { status: 400 });
    const { lessonId, direction } = parsed.data;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { include: { course: { select: { authorId: true } } } } },
    });
    if (!lesson) return NextResponse.json({ message: "Leçon introuvable." }, { status: 404 });
    if (lesson.section.course.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
    }

    const allLessons = await prisma.lesson.findMany({
      where: { sectionId: lesson.sectionId },
      orderBy: { position: "asc" },
    });
    const currentIdx = allLessons.findIndex(l => l.id === lessonId);
    const targetIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= allLessons.length) {
      return NextResponse.json({ message: "Déjà en limite." }, { status: 400 });
    }

    const target = allLessons[targetIdx];
    await prisma.$transaction([
      prisma.lesson.update({ where: { id: lesson.id }, data: { position: target.position } }),
      prisma.lesson.update({ where: { id: target.id }, data: { position: lesson.position } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Reorder lesson error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
