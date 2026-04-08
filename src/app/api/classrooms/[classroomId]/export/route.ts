import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_r: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: params.classroomId },
    include: {
      members: { include: { user: { select: { name: true, email: true } } } },
      courses: { include: { course: { select: { id: true, title: true } } } },
    },
  });
  if (!classroom) return NextResponse.json({ message: "Non trouve." }, { status: 404 });

  // Get all lessons from assigned courses
  const lessons = await prisma.lesson.findMany({
    where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
    select: { id: true, title: true, section: { select: { title: true } } },
    orderBy: { position: "asc" },
  });

  // Get all progress
  const progress = await prisma.lessonProgress.findMany({
    where: { userId: { in: classroom.members.map(m => m.userId) } },
  });

  // Get all activity results
  const results = await prisma.activityResult.findMany({
    where: { userId: { in: classroom.members.map(m => m.userId) }, completed: true },
    include: { activity: { select: { title: true, type: true } } },
  });

  // Build CSV
  const sep = ";";
  const lines: string[] = [];

  // Header
  const lessonTitles = lessons.map(l => l.section.title + " - " + l.title);
  lines.push(["Eleve", "Email", "Lecons faites", "Score moyen", ...lessonTitles].join(sep));

  // Rows
  classroom.members.forEach(m => {
    const memberProgress = progress.filter(p => p.userId === m.userId);
    const memberResults = results.filter(r => r.userId === m.userId);
    const completedCount = lessons.filter(l => memberProgress.find(p => p.lessonId === l.id && p.status === "completed")).length;

    // Dedup activity results
    const uniqueResults = new Map<string, number>();
    memberResults.forEach(r => {
      const ex = uniqueResults.get(r.activityId);
      if (!ex || (r.score || 0) > ex) uniqueResults.set(r.activityId, r.score || 0);
    });
    const scores = Array.from(uniqueResults.values());
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // Lesson statuses
    const lessonStatuses = lessons.map(l => {
      const p = memberProgress.find(p => p.lessonId === l.id);
      return p ? (p.status === "completed" ? "Faite" : "En cours") : "Non faite";
    });

    const name = (m.user.name || "?").replace(/;/g, ",");
    const email = (m.user.email || "").replace(/;/g, ",");
    lines.push([name, email, completedCount + "/" + lessons.length, Math.round(avgScore) + "%", ...lessonStatuses].join(sep));
  });

  // Activity scores sheet (append after empty line)
  lines.push("");
  lines.push("");
  lines.push("DETAIL DES ACTIVITES");
  lines.push("");

  // Get unique activities
  const allActivities = new Map<string, string>();
  results.forEach(r => allActivities.set(r.activityId, r.activity.title));
  const activityList = Array.from(allActivities.entries());

  lines.push(["Eleve", ...activityList.map(([_, title]) => title)].join(sep));

  classroom.members.forEach(m => {
    const memberResults = results.filter(r => r.userId === m.userId);
    const scores = activityList.map(([actId]) => {
      const r = memberResults.filter(r => r.activityId === actId).sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      return r ? Math.round(r.score || 0) + "%" : "-";
    });
    lines.push([(m.user.name || "?").replace(/;/g, ","), ...scores].join(sep));
  });

  const csv = "\uFEFF" + lines.join("\n"); // BOM for Excel UTF-8
  
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=" + classroom.name.replace(/[^a-zA-Z0-9]/g, "_") + "_resultats.csv",
    },
  });
}