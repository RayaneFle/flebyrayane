import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autorise." }, { status: 401 });

    const body = await request.json();
    const { score, timeSpent, completed } = body;

    // Validate score: must be a finite number between 0 and 100
    if (typeof score !== "number" || !isFinite(score) || score < 0 || score > 100) {
      return NextResponse.json({ message: "Score invalide." }, { status: 400 });
    }

    // Validate timeSpent: must be a non-negative finite integer (null allowed)
    if (timeSpent !== null && timeSpent !== undefined) {
      if (typeof timeSpent !== "number" || !isFinite(timeSpent) || timeSpent < 0 || timeSpent > 86400) {
        return NextResponse.json({ message: "Temps invalide." }, { status: 400 });
      }
    }

    // Verify activity exists
    const activity = await prisma.activity.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!activity) return NextResponse.json({ message: "Activite introuvable." }, { status: 404 });

    const safeCompleted = completed === false ? false : true;
    const safeScore = Math.round(score * 100) / 100; // max 2 decimals

    const result = await prisma.activityResult.upsert({
      where: { userId_activityId: { userId: session.user.id, activityId: params.id } },
      update: {
        score: safeScore,
        timeSpent: timeSpent ?? null,
        completed: safeCompleted,
        attempts: { increment: 1 },
        completedAt: safeCompleted ? new Date() : undefined,
      },
      create: {
        userId: session.user.id,
        activityId: params.id,
        score: safeScore,
        timeSpent: timeSpent ?? null,
        completed: safeCompleted,
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("ActivityResult error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
