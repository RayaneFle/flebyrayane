import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) return NextResponse.json({ message: "Non trouvé." }, { status: 404 });
  if (course.authorId !== session.user.id && session.user.role !== "admin") return NextResponse.json({ message: "Non autorisé." }, { status: 403 });

  const { title, description, level, published, requiresEnrollment } = await request.json();

  const updated = await prisma.course.update({
    where: { id: params.courseId },
    data: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(level ? { level } : {}),
      ...(published !== undefined ? { published } : {}),
      ...(requiresEnrollment !== undefined ? { requiresEnrollment } : {}),
    },
  });

  // Si on publie ou masque le cours, on met à jour les activités liées
  if (published !== undefined) {
    const activityIds = await prisma.lessonBlock.findMany({
      where: {
        activityId: { not: null },
        lesson: { section: { courseId: params.courseId } },
      },
      select: { activityId: true },
    });
    const ids = [...new Set(activityIds.map(b => b.activityId).filter(Boolean))] as string[];
    if (ids.length > 0) {
      await prisma.activity.updateMany({
        where: { id: { in: ids } },
        data: { isPublic: published },
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_r: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const course = await prisma.course.findUnique({ where: { id: params.courseId } });
  if (!course) return NextResponse.json({ message: "Non trouvé." }, { status: 404 });
  if (course.authorId !== session.user.id && session.user.role !== "admin") return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  try {
    const sections = await prisma.section.findMany({ where: { courseId: params.courseId }, include: { lessons: { include: { blocks: true } } } });
    const urls: string[] = [];
    sections.forEach(s => s.lessons.forEach(l => l.blocks.forEach(b => {
      if (b.content && b.content.includes("/storage/v1/object/public/uploads/")) {
        const matches = b.content.match(/\/storage\/v1\/object\/public\/uploads\/[^"\s)]+/g);
        if (matches) urls.push(...matches);
      }
    })));
    if (urls.length > 0) {
      const paths = urls.map(u => u.split("/uploads/").pop()!).filter(Boolean);
      await supabase.storage.from("uploads").remove(paths);
    }
  } catch {}
  await prisma.course.delete({ where: { id: params.courseId } });
  return NextResponse.json({ success: true });
}
