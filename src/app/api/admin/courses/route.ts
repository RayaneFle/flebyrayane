import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify, generateClassCode } from "@/lib/utils";


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
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { title, description, level, requiresEnrollment } = await request.json();
  if (!title || !description || !level) return NextResponse.json({ message: "Champs requis." }, { status: 400 });
  let slug = slugify(title);
  const exists = await prisma.course.findUnique({ where: { slug } });
  if (exists) slug = slug + "-" + Date.now();
  const course = await prisma.course.create({
    data: { title, description, slug, level, published: true, authorId: session.user.id, requiresEnrollment: requiresEnrollment || false, enrollmentCode: requiresEnrollment ? generateClassCode() : null },
  });
  return NextResponse.json(course, { status: 201 });
}
