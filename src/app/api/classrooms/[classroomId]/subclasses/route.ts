import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_r: Request, { params }: { params: { classroomId: string } }) {
  const subclasses = await prisma.subclass.findMany({
    where: { classroomId: params.classroomId },
    include: { members: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(subclasses);
}

export async function POST(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }
  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ message: "Nom requis." }, { status: 400 });
  
  const subclass = await prisma.subclass.create({
    data: { name: name.trim(), classroomId: params.classroomId },
  });
  return NextResponse.json(subclass);
}