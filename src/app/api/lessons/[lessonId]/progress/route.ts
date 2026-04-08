import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { lessonId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  
  const { status } = await request.json();
  
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
}

export async function GET(_r: Request, { params }: { params: { lessonId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ status: "not_started" });
  
  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId: params.lessonId } },
  });
  
  return NextResponse.json({ status: progress?.status || "not_started" });
}