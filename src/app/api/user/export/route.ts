import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Non autorise." }, { status: 401 });
    }

    const userId = session.user.id;

    const [user, activityResults, lessonProgress, enrollments, memberships, posts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true, role: true,
          createdAt: true, updatedAt: true, image: true,
        },
      }),
      prisma.activityResult.findMany({
        where: { userId },
        include: { activity: { select: { title: true, type: true, level: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lessonProgress.findMany({
        where: { userId },
        include: { lesson: { select: { title: true, section: { select: { title: true, course: { select: { title: true } } } } } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { title: true, slug: true, level: true } } },
      }),
      prisma.classroomMember.findMany({
        where: { userId },
        include: { classroom: { select: { name: true, code: true, owner: { select: { name: true } } } } },
      }),
      prisma.classroomPost.findMany({
        where: { authorId: userId },
        include: { classroom: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 });
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      exportNote: "Export RGPD de vos donnees personnelles. Ce fichier contient toutes les donnees que FLE by Rayane detient sur vous.",
      profile: user,
      activityResults: activityResults.map(r => ({
        activity: r.activity.title,
        type: r.activity.type,
        level: r.activity.level,
        score: r.score,
        completed: r.completed,
        attempts: r.attempts,
        timeSpent: r.timeSpent,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
      })),
      lessonProgress: lessonProgress.map(p => ({
        lesson: p.lesson.title,
        section: p.lesson.section.title,
        course: p.lesson.section.course.title,
        status: p.status,
        completedAt: p.completedAt,
        updatedAt: p.updatedAt,
      })),
      courseEnrollments: enrollments.map(e => ({
        course: e.course.title,
        level: e.course.level,
        progress: e.progress,
        createdAt: e.createdAt,
      })),
      classroomMemberships: memberships.map(m => ({
        classroom: m.classroom.name,
        code: m.classroom.code,
        teacher: m.classroom.owner.name,
        joinedAt: m.joinedAt,
      })),
      classroomPosts: posts.map(p => ({
        classroom: p.classroom.name,
        type: p.type,
        title: p.title,
        content: p.content,
        fileName: p.fileName,
        videoUrl: p.videoUrl,
        createdAt: p.createdAt,
      })),
    };

    const filename = "mes-donnees-fle-" + new Date().toISOString().split("T")[0] + ".json";

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=\"" + filename + "\"",
      },
    });
  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ message: "Erreur lors de l'export." }, { status: 500 });
  }
}
