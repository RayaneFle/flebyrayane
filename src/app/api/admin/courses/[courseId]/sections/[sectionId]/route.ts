import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_r: Request, { params }: { params: { courseId: string; sectionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  await prisma.section.delete({ where: { id: params.sectionId } });
  return NextResponse.json({ success: true });
}
