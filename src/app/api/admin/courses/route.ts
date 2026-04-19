import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, generateClassCode } from "@/lib/utils";
import { z } from "zod";

const CreateCourseSchema = z.object({
  title: z.string().trim().min(1, "Titre requis.").max(200, "Titre trop long."),
  description: z.string().trim().min(1, "Description requise.").max(2000, "Description trop longue."),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"], { errorMap: () => ({ message: "Niveau invalide." }) }),
  requiresEnrollment: z.boolean().optional().default(false),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([]);
  const courses = await prisma.course.findMany({
    where: { authorId: session.user.id },
    select: { id: true, title: true, sections: { select: { id: true, title: true }, orderBy: { position: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(courses);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
      return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateCourseSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message || "Données invalides.";
      return NextResponse.json({ message }, { status: 400 });
    }
    const { title, description, level, requiresEnrollment } = parsed.data;

    let slug = slugify(title);
    const exists = await prisma.course.findUnique({ where: { slug } });
    if (exists) slug = slug + "-" + Date.now();

    const course = await prisma.course.create({
      data: {
        title, description, slug, level,
        published: true,
        authorId: session.user.id,
        requiresEnrollment,
        enrollmentCode: requiresEnrollment ? generateClassCode() : null,
      },
    });
    return NextResponse.json(course, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
