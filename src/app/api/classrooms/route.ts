import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateClassCode } from "@/lib/utils";
import { rateLimit, getClientKey } from "@/lib/ratelimit";
import { z } from "zod";

const JoinSchema = z.object({
  code: z.string().trim().length(6, "Code invalide (6 caractères attendus)."),
});

const CreateSchema = z.object({
  name: z.string().trim().min(1, "Nom requis.").max(100, "Nom trop long."),
  description: z.string().trim().max(500, "Description trop longue.").optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const isTeacher = session.user.role === "admin" || session.user.role === "teacher";
  if (isTeacher) {
    const classrooms = await prisma.classroom.findMany({
      where: { ownerId: session.user.id },
      include: { _count: { select: { members: true, courses: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(classrooms);
  }
  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id },
    include: { classroom: { include: { owner: { select: { name: true } }, _count: { select: { members: true, courses: true } } } } },
    orderBy: { joinedAt: "desc" },
  });
  return NextResponse.json(memberships.map(m => m.classroom));
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    const body = await request.json();

    if (body && typeof body.code !== "undefined") {
      const key = getClientKey(request, "join:" + session.user.id);
      if (rateLimit(key, { windowMs: 15 * 60 * 1000, max: 10 })) {
        return NextResponse.json({ message: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
      }
      const parsed = JoinSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ message: parsed.error.errors[0]?.message || "Code invalide." }, { status: 400 });
      }
      const { code } = parsed.data;
      const classroom = await prisma.classroom.findUnique({ where: { code: code.toUpperCase() } });
      if (!classroom) return NextResponse.json({ message: "Code introuvable." }, { status: 404 });
      const existing = await prisma.classroomMember.findUnique({
        where: { userId_classroomId: { userId: session.user.id, classroomId: classroom.id } },
      });
      if (existing) return NextResponse.json({ message: "Déjà inscrit." }, { status: 409 });
      await prisma.classroomMember.create({ data: { userId: session.user.id, classroomId: classroom.id } });
      return NextResponse.json({ message: "OK", classroom });
    }

    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
    }
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0]?.message || "Données invalides." }, { status: 400 });
    }
    const { name, description } = parsed.data;
    let code = generateClassCode();
    while (await prisma.classroom.findUnique({ where: { code } })) code = generateClassCode();
    const classroom = await prisma.classroom.create({
      data: { name, description: description || null, code, ownerId: session.user.id },
    });
    return NextResponse.json(classroom, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
