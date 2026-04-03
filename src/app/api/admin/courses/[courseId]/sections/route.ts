import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { title } = await request.json();
  if (!title) return NextResponse.json({ message: "Titre requis." }, { status: 400 });
  const last = await prisma.section.findFirst({ where: { courseId: params.courseId }, orderBy: { position: "desc" } });
  const section = await prisma.section.create({ data: { title, position: (last?.position ?? -1) + 1, courseId: params.courseId } });
  return NextResponse.json(section, { status: 201 });
}
