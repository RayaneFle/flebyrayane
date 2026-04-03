import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({ where: { slug: params.slug }, select: { id: true, title: true, requiresEnrollment: true } });
  if (!course) return NextResponse.json({ message: "Non trouvé." }, { status: 404 });
  return NextResponse.json(course);
}
