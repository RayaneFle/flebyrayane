import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditClassroom } from "@/lib/authz";

export async function DELETE(_r: Request, { params }: { params: { classroomId: string; postId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const classroom = await canEditClassroom(params.classroomId, session.user.id, session.user.role);
  if (!classroom) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  const post = await prisma.classroomPost.findUnique({
    where: { id: params.postId }, select: { classroomId: true },
  });
  if (!post || post.classroomId !== params.classroomId) {
    return NextResponse.json({ message: "Post introuvable." }, { status: 404 });
  }
  await prisma.classroomPost.delete({ where: { id: params.postId } });
  return NextResponse.json({ success: true });
}
