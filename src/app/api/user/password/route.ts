import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis.").max(200),
  newPassword: z.string().min(8, "8 caractères minimum.").max(200, "Mot de passe trop long."),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });

    const body = await request.json();
    const parsed = PasswordSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message || "Données invalides.";
      return NextResponse.json({ message }, { status: 400 });
    }
    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.hashedPassword) return NextResponse.json({ message: "Erreur." }, { status: 400 });

    const valid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!valid) return NextResponse.json({ message: "Mot de passe actuel incorrect." }, { status: 403 });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: session.user.id }, data: { hashedPassword: hashed } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
