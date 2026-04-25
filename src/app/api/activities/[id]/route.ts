import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditActivity } from "@/lib/authz";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const a = await prisma.activity.findUnique({
    where: { id: params.id },
    include: { createdBy: { select: { name: true } }, _count: { select: { results: true } } },
  });
  if (!a) return NextResponse.json({ message: "Non trouvé." }, { status: 404 });
  return NextResponse.json({ ...a, config: JSON.parse(a.config) });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const allowed = await canEditActivity(params.id, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });

  const { title, description, config, level, isPublic } = await request.json();
  const updated = await prisma.activity.update({
    where: { id: params.id },
    data: {
      ...(title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(config ? { config: JSON.stringify(config) } : {}),
      ...(level !== undefined ? { level } : {}),
      ...(isPublic !== undefined ? { isPublic } : {}),
    },
  });
  return NextResponse.json({ ...updated, config: JSON.parse(updated.config) });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
  if (session.user.role !== "admin" && session.user.role !== "teacher") {
    return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  }
  const allowed = await canEditActivity(params.id, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ message: "Non autorisé." }, { status: 403 });
  await prisma.activity.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
