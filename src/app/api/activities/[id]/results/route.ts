import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { score, timeSpent, completed } = await request.json();
  const result = await prisma.activityResult.upsert({
    where: { userId_activityId: { userId: session.user.id, activityId: params.id } },
    update: { score, timeSpent, completed: completed ?? true, attempts: { increment: 1 }, completedAt: completed ? new Date() : undefined },
    create: { userId: session.user.id, activityId: params.id, score, timeSpent, completed: completed ?? true },
  });
  return NextResponse.json(result);
}
