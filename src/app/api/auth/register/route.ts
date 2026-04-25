import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientKey } from "@/lib/ratelimit";

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Nom requis.").max(100, "Nom trop long."),
  email: z.string().trim().toLowerCase().email("Email invalide.").max(200),
  password: z.string().min(8, "8 caractères minimum.").max(200, "Mot de passe trop long."),
});

export async function POST(request: Request) {
  try {
    const key = getClientKey(request, "register");
    if (rateLimit(key, { windowMs: 10 * 60 * 1000, max: 5 })) {
      return NextResponse.json({ message: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
    }
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0]?.message || "Données invalides." }, { status: 400 });
    }
    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ message: "Email déjà utilisé." }, { status: 409 });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, hashedPassword: hashed, role: "student" } });
    return NextResponse.json({ message: "OK", userId: user.id }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
