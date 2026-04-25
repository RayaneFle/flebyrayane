import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditCourse } from "@/lib/authz";
import { z } from "zod";

const CreateSectionSchema = z.object({
  title: z.string().trim().min(1, "Titre requis.").max(200, "Titre trop long."),
});

export async function POST(request: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const course = await canEditCourse(params.courseId, session.user.id, session.user.role);
  if (!course) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const body = await request.json();
  const parsed = CreateSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message || "Données invalides." }, { status: 400 });
  }
  const last = await prisma.section.findFirst({
    where: { courseId: params.courseId }, orderBy: { position: "desc" },
  });
  const section = await prisma.section.create({
    data: { title: parsed.data.title, position: (last?.position ?? -1) + 1, courseId: params.courseId },
  });
  return NextResponse.json(section, { status: 201 });
}
