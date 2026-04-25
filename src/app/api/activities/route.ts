import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateActivitySchema = z.object({
  title: z.string().trim().min(1, "Titre requis.").max(200, "Titre trop long."),
  description: z.string().trim().max(1000).optional().nullable(),
  type: z.string().min(1, "Type requis.").max(50),
  config: z.any(),
  level: z.string().max(10).optional().nullable(),
  isPublic: z.boolean().optional(),
});

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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
    if (session.user.role !== "admin" && session.user.role !== "teacher") {
      return NextResponse.json({ message: "Seuls les enseignants peuvent créer des activités." }, { status: 403 });
    }
    const body = await request.json();
    const parsed = CreateActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.errors[0]?.message || "Données invalides." }, { status: 400 });
    }
    const { title, description, type, config, level, isPublic } = parsed.data;
    const activity = await prisma.activity.create({
      data: {
        title, description: description || null, type,
        config: JSON.stringify(config),
        level: level || null,
        isPublic: isPublic ?? true,
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ ...activity, config: JSON.parse(activity.config) }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
