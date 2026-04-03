import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  const { activityId } = await request.json();
  const existing = await prisma.classroomActivity.findUnique({ where: { classroomId_activityId: { classroomId: params.classroomId, activityId } } });
  if (existing) return NextResponse.json({ message: "Deja assigne." }, { status: 409 });
  const ca = await prisma.classroomActivity.create({ data: { classroomId: params.classroomId, activityId } });
  return NextResponse.json(ca, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  const { activityId } = await request.json();
  await prisma.classroomActivity.deleteMany({ where: { classroomId: params.classroomId, activityId } });
  return NextResponse.json({ success: true });
}