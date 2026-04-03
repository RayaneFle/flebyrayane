import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) return NextResponse.json({ message: "Champs requis." }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ message: "6 caractères minimum." }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ message: "Email déjà utilisé." }, { status: 409 });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, hashedPassword: hashed, role: "student" } });
    return NextResponse.json({ message: "OK", userId: user.id }, { status: 201 });
  } catch { return NextResponse.json({ message: "Erreur serveur." }, { status: 500 }); }
}
