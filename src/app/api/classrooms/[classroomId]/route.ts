import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewClassroom } from "@/lib/authz";

export async function GET(_req: Request, { params }: { params: { classroomId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });

    const ok = await canViewClassroom(params.classroomId, session.user.id, session.user.role);
    if (!ok) return NextResponse.json({ message: "Accès refusé." }, { status: 403 });

    const classroom = await prisma.classroom.findUnique({
      where: { id: params.classroomId },
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { members: true } },
        courses: {
          include: {
            course: {
              include: {
                sections: { include: { _count: { select: { lessons: true } } } },
              },
            },
          },
          orderBy: { assignedAt: "asc" },
        },
        activities: {
          include: { activity: true },
          orderBy: { assignedAt: "asc" },
        },
      },
    });

    if (!classroom) return NextResponse.json({ message: "Classe introuvable." }, { status: 404 });

    return NextResponse.json({
      id:          classroom.id,
      name:        classroom.name,
      description: classroom.description,
      code:        classroom.code,
      owner:       classroom.owner,
      _count:      classroom._count,
      courses:     classroom.courses.map(cc => cc.course),
      activities:  classroom.activities.map(ca => ca.activity),
    });
  } catch (e: any) {
    console.error("GET classroom error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}

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
