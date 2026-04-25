import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditSection } from "@/lib/authz";

export async function DELETE(_r: Request, { params }: { params: { courseId: string; sectionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const section = await canEditSection(params.sectionId, session.user.id, session.user.role);
  if (!section) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  await prisma.section.delete({ where: { id: params.sectionId } });
  return NextResponse.json({ success: true });
}
