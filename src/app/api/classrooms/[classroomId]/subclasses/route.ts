import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditClassroom, canViewClassroom } from "@/lib/authz";
import { z } from "zod";

const CreateSubclassSchema = z.object({
  name: z.string().trim().min(1, "Nom requis.").max(100, "Nom trop long."),
});

export async function GET(_r: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const ok = await canViewClassroom(params.classroomId, session.user.id, session.user.role);
  if (!ok) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const subclasses = await prisma.subclass.findMany({
    where: { classroomId: params.classroomId },
    include: { members: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(subclasses);
}

export async function POST(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const classroom = await canEditClassroom(params.classroomId, session.user.id, session.user.role);
  if (!classroom) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const body = await request.json();
  const parsed = CreateSubclassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message || "Données invalides." }, { status: 400 });
  }
  const subclass = await prisma.subclass.create({
    data: { name: parsed.data.name, classroomId: params.classroomId },
  });
  return NextResponse.json(subclass);
}
