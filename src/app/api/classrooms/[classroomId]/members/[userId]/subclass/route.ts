import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditClassroom } from "@/lib/authz";

export async function PUT(request: Request, { params }: { params: { classroomId: string; userId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const classroom = await canEditClassroom(params.classroomId, session.user.id, session.user.role);
  if (!classroom) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const { subclassId } = await request.json();
  if (subclassId) {
    const subclass = await prisma.subclass.findUnique({
      where: { id: subclassId }, select: { classroomId: true },
    });
    if (!subclass || subclass.classroomId !== params.classroomId) {
      return NextResponse.json({ message: "Sous-classe invalide." }, { status: 400 });
    }
  }
  await prisma.classroomMember.updateMany({
    where: { classroomId: params.classroomId, userId: params.userId },
    data: { subclassId: subclassId || null },
  });
  return NextResponse.json({ success: true });
}
