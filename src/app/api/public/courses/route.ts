import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint for the mobile app.
// GET /api/public/courses          → all published courses (with section/lesson counts)
// GET /api/public/courses?level=A1 → filtered by CECRL level
// GET /api/public/courses?slug=xxx → single course with full sections + lesson ids

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const slug  = searchParams.get("slug");

    if (slug) {
      const course = await prisma.course.findUnique({
        where: { slug },
        include: {
          author: { select: { name: true } },
          sections: {
            orderBy: { position: "asc" },
            include: {
              lessons: {
                where: { hidden: false },
                orderBy: { position: "asc" },
                select: { id: true, title: true, position: true },
              },
            },
          },
          _count: { select: { enrollments: true } },
        },
      });
      if (!course || !course.published) {
        return NextResponse.json({ message: "Non trouvé." }, { status: 404 });
      }
      return NextResponse.json(course);
    }

    const courses = await prisma.course.findMany({
      where: {
        published: true,
        ...(level ? { level } : {}),
      },
      include: {
        author: { select: { name: true } },
        sections: {
          orderBy: { position: "asc" },
          include: { _count: { select: { lessons: true } } },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(courses);
  } catch (e) {
    console.error("Public courses error:", e);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
