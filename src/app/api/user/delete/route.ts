import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Non autorise." }, { status: 401 });
    }

    // Admins must not delete themselves this way (safety)
    if (session.user.role === "admin") {
      return NextResponse.json({ message: "Les administrateurs doivent faire supprimer leur compte par un autre administrateur." }, { status: 403 });
    }

    const { password } = await request.json();
    if (!password || typeof password !== "string") {
      return NextResponse.json({ message: "Mot de passe requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, hashedPassword: true },
    });

    if (!user || !user.hashedPassword) {
      return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
    }

    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json({ message: "Mot de passe incorrect." }, { status: 400 });
    }

    // Delete user - cascade will handle related records (ActivityResult, LessonProgress, etc.)
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("User self-delete error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
