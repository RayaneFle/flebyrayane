import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { courseId, enrollmentCode } = await request.json();
  if (!courseId) return NextResponse.json({ message: "courseId requis." }, { status: 400 });
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ message: "Cours non trouvé." }, { status: 404 });
  if (course.requiresEnrollment && course.enrollmentCode !== enrollmentCode) return NextResponse.json({ message: "Code d'inscription incorrect." }, { status: 403 });
  const existing = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: session.user.id, courseId } } });
  if (existing) return NextResponse.json({ message: "Déjà inscrit." }, { status: 409 });
  await prisma.enrollment.create({ data: { userId: session.user.id, courseId } });
  return NextResponse.json({ success: true }, { status: 201 });
}
