import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditClassroom } from "@/lib/authz";

export async function POST(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const classroom = await canEditClassroom(params.classroomId, session.user.id, session.user.role);
  if (!classroom) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const { activityId } = await request.json();
  if (!activityId) return NextResponse.json({ message: "activityId requis." }, { status: 400 });
  const existing = await prisma.classroomActivity.findUnique({
    where: { classroomId_activityId: { classroomId: params.classroomId, activityId } },
  });
  if (existing) return NextResponse.json({ message: "Déjà assigné." }, { status: 409 });
  const ca = await prisma.classroomActivity.create({
    data: { classroomId: params.classroomId, activityId },
  });
  return NextResponse.json(ca, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const classroom = await canEditClassroom(params.classroomId, session.user.id, session.user.role);
  if (!classroom) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const { activityId } = await request.json();
  await prisma.classroomActivity.deleteMany({ where: { classroomId: params.classroomId, activityId } });
  return NextResponse.json({ success: true });
}
