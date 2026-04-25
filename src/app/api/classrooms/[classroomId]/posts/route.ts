import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditClassroom, canViewClassroom } from "@/lib/authz";
import { z } from "zod";

const PostSchema = z.object({
  type: z.string().max(20).optional(),
  title: z.string().trim().max(200).optional().nullable(),
  content: z.string().max(10000).optional().nullable(),
  fileUrl: z.string().url().max(2000).optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
  videoUrl: z.string().url().max(2000).optional().nullable(),
});

export async function GET(_r: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const ok = await canViewClassroom(params.classroomId, session.user.id, session.user.role);
  if (!ok) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
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
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const classroom = await canEditClassroom(params.classroomId, session.user.id, session.user.role);
  if (!classroom) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const body = await request.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message || "Données invalides." }, { status: 400 });
  }
  const { type, title, content, fileUrl, fileName, videoUrl } = parsed.data;
  const post = await prisma.classroomPost.create({
    data: {
      classroomId: params.classroomId,
      authorId: session.user.id,
      type: type || "text",
      title: title || null,
      content: content || null,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      videoUrl: videoUrl || null,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
