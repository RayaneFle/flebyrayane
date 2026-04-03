import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClassCode } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const isTeacher = session.user.role === "admin" || session.user.role === "teacher";
  if (isTeacher) {
    const classrooms = await prisma.classroom.findMany({ where: { ownerId: session.user.id }, include: { _count: { select: { members: true, courses: true } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(classrooms);
  }
  const memberships = await prisma.classroomMember.findMany({ where: { userId: session.user.id }, include: { classroom: { include: { owner: { select: { name: true } }, _count: { select: { members: true, courses: true } } } } }, orderBy: { joinedAt: "desc" } });
  return NextResponse.json(memberships.map(m => m.classroom));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const body = await request.json();

  if (body.code) {
    const classroom = await prisma.classroom.findUnique({ where: { code: body.code } });
    if (!classroom) return NextResponse.json({ message: "Code introuvable." }, { status: 404 });
    const existing = await prisma.classroomMember.findUnique({ where: { userId_classroomId: { userId: session.user.id, classroomId: classroom.id } } });
    if (existing) return NextResponse.json({ message: "Déjà inscrit." }, { status: 409 });
    await prisma.classroomMember.create({ data: { userId: session.user.id, classroomId: classroom.id } });
    return NextResponse.json({ message: "OK", classroom });
  }

  if (session.user.role !== "admin" && session.user.role !== "teacher") return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  if (!body.name) return NextResponse.json({ message: "Nom requis." }, { status: 400 });
  let code = generateClassCode();
  while (await prisma.classroom.findUnique({ where: { code } })) code = generateClassCode();
  const classroom = await prisma.classroom.create({ data: { name: body.name, description: body.description || null, code, ownerId: session.user.id } });
  return NextResponse.json(classroom, { status: 201 });
}
