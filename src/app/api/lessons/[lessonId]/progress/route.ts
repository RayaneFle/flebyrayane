import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = new Set(["not_started", "in_progress", "completed"]);

export async function POST(request: Request, { params }: { params: { lessonId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autorise." }, { status: 401 });

    const { status } = await request.json();

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ message: "Statut invalide." }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: params.lessonId }, select: { id: true } });
    if (!lesson) return NextResponse.json({ message: "Lecon introuvable." }, { status: 404 });

    // Don't downgrade: if already completed, keep it completed
    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId: params.lessonId } },
    });

    if (existing?.status === "completed" && status !== "completed") {
      return NextResponse.json(existing);
    }

    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: session.user.id, lessonId: params.lessonId } },
      update: {
        status,
        updatedAt: new Date(),
        ...(status === "completed" ? { completedAt: new Date() } : {}),
      },
      create: {
        userId: session.user.id,
        lessonId: params.lessonId,
        status,
        ...(status === "completed" ? { completedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(progress);
  } catch (e) {
    console.error("LessonProgress POST error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}

export async function GET(_r: Request, { params }: { params: { lessonId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ status: "not_started" });

    const progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId: params.lessonId } },
    });

    return NextResponse.json({ status: progress?.status || "not_started" });
  } catch (e) {
    console.error("LessonProgress GET error:", e);
    return NextResponse.json({ status: "not_started" });
  }
}
