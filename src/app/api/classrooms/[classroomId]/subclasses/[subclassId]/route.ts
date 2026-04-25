import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditClassroom } from "@/lib/authz";

export async function DELETE(_r: Request, { params }: { params: { classroomId: string; subclassId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const classroom = await canEditClassroom(params.classroomId, session.user.id, session.user.role);
  if (!classroom) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const subclass = await prisma.subclass.findUnique({
    where: { id: params.subclassId }, select: { classroomId: true },
  });
  if (!subclass || subclass.classroomId !== params.classroomId) {
    return NextResponse.json({ message: "Sous-classe introuvable." }, { status: 404 });
  }
  await prisma.subclass.delete({ where: { id: params.subclassId } });
  return NextResponse.json({ success: true });
}
