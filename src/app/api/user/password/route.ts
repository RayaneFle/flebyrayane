import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) return NextResponse.json({ message: "Champs requis." }, { status: 400 });
  if (newPassword.length < 6) return NextResponse.json({ message: "6 caractères minimum." }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.hashedPassword) return NextResponse.json({ message: "Erreur." }, { status: 400 });
  const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
  if (!valid) return NextResponse.json({ message: "Mot de passe actuel incorrect." }, { status: 403 });
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { hashedPassword: hashed } });
  return NextResponse.json({ success: true });
}
