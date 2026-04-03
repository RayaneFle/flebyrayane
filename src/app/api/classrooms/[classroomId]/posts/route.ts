import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_r: Request, { params }: { params: { classroomId: string } }) {
  const posts = await prisma.classroomPost.findMany({
    where: { classroomId: params.classroomId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(posts);
}

export async function POST(request: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const { type, title, content, fileUrl, fileName, videoUrl } = await request.json();
  const post = await prisma.classroomPost.create({
    data: { classroomId: params.classroomId, authorId: session.user.id, type: type || "text", title, content, fileUrl, fileName, videoUrl },
  });
  return NextResponse.json(post, { status: 201 });
}
