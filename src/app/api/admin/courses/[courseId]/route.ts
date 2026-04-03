import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) return NextResponse.json({ message: "Non trouvé." }, { status: 404 });
  if (course.authorId !== session.user.id && session.user.role !== "admin") return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const { title, description, level, published, requiresEnrollment } = await request.json();
  const updated = await prisma.course.update({ where: { id: params.courseId }, data: { ...(title?{title}:{}), ...(description?{description}:{}), ...(level?{level}:{}), ...(published!==undefined?{published}:{}), ...(requiresEnrollment!==undefined?{requiresEnrollment}:{}) } });
  return NextResponse.json(updated);
}

export async function DELETE(_r: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) return NextResponse.json({ message: "Non trouvé." }, { status: 404 });
  if (course.authorId !== session.user.id && session.user.role !== "admin") return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  await prisma.course.delete({ where: { id: params.courseId } });
  return NextResponse.json({ success: true });
}
