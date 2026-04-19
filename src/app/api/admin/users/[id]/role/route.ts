import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (params.id === session.user.id) return NextResponse.json({ message: "Impossible de modifier votre propre rôle." }, { status: 400 });
  const { role } = await request.json();
  if (!["admin", "teacher", "student"].includes(role)) return NextResponse.json({ message: "Rôle invalide." }, { status: 400 });
  const user = await prisma.user.update({ where: { id: params.id }, data: { role } });
  return NextResponse.json({ id: user.id, role: user.role });
}
