import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { courseId } = await request.json();
  if (!courseId) return NextResponse.json({ message: "courseId requis." }, { status: 400 });
  const existing = await prisma.classroomCourse.findUnique({ where: { classroomId_courseId: { classroomId: params.classroomId, courseId } } });
  if (existing) return NextResponse.json({ message: "Déjà assigné." }, { status: 409 });
  await prisma.classroomCourse.create({ data: { classroomId: params.classroomId, courseId } });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  const { courseId } = await request.json();
  await prisma.classroomCourse.deleteMany({ where: { classroomId: params.classroomId, courseId } });
  return NextResponse.json({ success: true });
}
