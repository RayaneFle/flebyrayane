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
  const { courseId } = await request.json();
  if (!courseId) return NextResponse.json({ message: "courseId requis." }, { status: 400 });
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return NextResponse.json({ message: "Cours introuvable." }, { status: 404 });
  const existing = await prisma.classroomCourse.findUnique({
    where: { classroomId_courseId: { classroomId: params.classroomId, courseId } },
  });
  if (existing) return NextResponse.json({ message: "Déjà assigné." }, { status: 409 });
  await prisma.classroomCourse.create({ data: { classroomId: params.classroomId, courseId } });
  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const classroom = await canEditClassroom(params.classroomId, session.user.id, session.user.role);
  if (!classroom) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const { courseId } = await request.json();
  await prisma.classroomCourse.deleteMany({ where: { classroomId: params.classroomId, courseId } });
  return NextResponse.json({ success: true });
}
