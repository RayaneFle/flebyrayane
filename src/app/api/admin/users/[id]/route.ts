import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_r: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  
  // Don't allow deleting own account
  if (params.id === session.user.id) return NextResponse.json({ message: "Impossible de supprimer votre propre compte." }, { status: 400 });
  
  // Supprimer les classrooms dont l'utilisateur est owner (pas de cascade automatique)
  await prisma.classroom.deleteMany({ where: { ownerId: params.id } });

  // Delete user - cascade will handle the rest
  await prisma.user.delete({ where: { id: params.id } });
  
  return NextResponse.json({ success: true });
}
