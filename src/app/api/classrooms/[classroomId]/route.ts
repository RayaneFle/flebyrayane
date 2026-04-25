import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { classroomId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });

    const classroom = await prisma.classroom.findUnique({
      where: { id: params.classroomId },
      select: { ownerId: true },
    });
    if (!classroom) return NextResponse.json({ message: "Classe introuvable." }, { status: 404 });

    if (classroom.ownerId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
    }

    await prisma.classroom.delete({ where: { id: params.classroomId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Delete classroom error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
