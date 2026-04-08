import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_r: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const original = await prisma.activity.findUnique({ where: { id: params.id } });
  if (!original) return NextResponse.json({ message: "Non trouve." }, { status: 404 });

  const newActivity = await prisma.activity.create({
    data: {
      title: original.title + " (copie)",
      description: original.description,
      type: original.type,
      config: original.config,
      level: original.level,
      isPublic: original.isPublic,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(newActivity);
}