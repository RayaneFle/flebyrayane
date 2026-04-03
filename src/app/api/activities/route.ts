import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const level = searchParams.get("level");
  const activities = await prisma.activity.findMany({
    where: { isPublic: true, ...(type ? { type } : {}), ...(level ? { level } : {}) },
    include: { createdBy: { select: { name: true } }, _count: { select: { results: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(activities.map(a => ({ ...a, config: JSON.parse(a.config) })));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  const { title, description, type, config, level, isPublic } = await request.json();
  if (!title || !type || !config) return NextResponse.json({ message: "Champs requis." }, { status: 400 });
  const activity = await prisma.activity.create({
    data: { title, description, type, config: JSON.stringify(config), level: level || null, isPublic: isPublic ?? true, createdById: session.user.id },
  });
  return NextResponse.json({ ...activity, config: JSON.parse(activity.config) }, { status: 201 });
}
