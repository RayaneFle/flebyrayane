import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_r: Request, { params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const original = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      sections: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            include: { blocks: { orderBy: { position: "asc" } } },
          },
        },
      },
    },
  });
  if (!original) return NextResponse.json({ message: "Non trouve." }, { status: 404 });

  const slug = original.slug + "-copie-" + Date.now().toString(36);

  const newCourse = await prisma.course.create({
    data: {
      title: original.title + " (copie)",
      description: original.description,
      slug,
      imageUrl: original.imageUrl,
      level: original.level,
      published: false,
      authorId: session.user.id,
      sections: {
        create: original.sections.map(s => ({
          title: s.title,
          position: s.position,
          lessons: {
            create: s.lessons.map(l => ({
              title: l.title,
              content: l.content,
              type: l.type,
              fileUrl: l.fileUrl,
              position: l.position,
              blocks: {
                create: l.blocks.map(b => ({
                  position: b.position,
                  type: b.type,
                  content: b.content,
                  activityId: b.activityId,
                  requireScore: b.requireScore,
                  minScore: b.minScore,
                })),
              },
            })),
          },
        })),
      },
    },
  });

  return NextResponse.json({ id: newCourse.id, slug: newCourse.slug });
}