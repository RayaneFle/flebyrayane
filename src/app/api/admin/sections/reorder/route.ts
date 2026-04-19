import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReorderSchema = z.object({
  sectionId: z.string().min(1),
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
    const { sectionId, direction } = parsed.data;

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: { select: { authorId: true } } },
    });
    if (!section) return NextResponse.json({ message: "Section introuvable." }, { status: 404 });
    if (section.course.authorId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
    }

    const allSections = await prisma.section.findMany({
      where: { courseId: section.courseId },
      orderBy: { position: "asc" },
    });
    const currentIdx = allSections.findIndex(s => s.id === sectionId);
    const targetIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= allSections.length) {
      return NextResponse.json({ message: "Déjà en limite." }, { status: 400 });
    }

    const target = allSections[targetIdx];
    await prisma.$transaction([
      prisma.section.update({ where: { id: section.id }, data: { position: target.position } }),
      prisma.section.update({ where: { id: target.id }, data: { position: section.position } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Reorder section error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
