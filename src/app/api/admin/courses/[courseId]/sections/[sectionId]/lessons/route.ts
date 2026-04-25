import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditSection } from "@/lib/authz";
import { z } from "zod";

const CreateLessonSchema = z.object({
  title: z.string().trim().min(1, "Titre requis.").max(200, "Titre trop long."),
  blocks: z.array(z.any()).optional(),
});

export async function POST(request: Request, { params }: { params: { courseId: string; sectionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const section = await canEditSection(params.sectionId, session.user.id, session.user.role);
  if (!section) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const body = await request.json();
  const parsed = CreateLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message || "Données invalides." }, { status: 400 });
  }
  const { title, blocks } = parsed.data;
  const last = await prisma.lesson.findFirst({
    where: { sectionId: params.sectionId }, orderBy: { position: "desc" },
  });
  const lesson = await prisma.lesson.create({
    data: {
      title, type: "MIXED",
      position: (last?.position ?? -1) + 1,
      sectionId: params.sectionId,
      blocks: { create: (blocks || []).map((b: any, i: number) => ({
        position: i, type: b.type, content: b.content || null,
        activityId: b.activityId || null,
        requireScore: b.requireScore || false,
        minScore: b.minScore || 60,
      })) },
    },
  });
  return NextResponse.json(lesson, { status: 201 });
}
