import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { lessonId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });

    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        section: {
          select: {
            title: true,
            course: { select: { slug: true } },
          },
        },
        blocks: {
          include: {
            activity: {
              select: { id: true, type: true, config: true, title: true },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!lesson) return NextResponse.json({ message: "Leçon introuvable." }, { status: 404 });

    return NextResponse.json({
      ...lesson,
      blocks: lesson.blocks.map((block) => ({
        ...block,
        activity: block.activity
          ? {
              ...block.activity,
              config: (() => {
                try { return JSON.parse(block.activity!.config); } catch { return {}; }
              })(),
            }
          : null,
      })),
    });
  } catch (e) {
    console.error("Lesson GET error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
