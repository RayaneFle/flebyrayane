import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function GET(_r: Request, { params }: { params: { classroomId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) {
    return NextResponse.json({ message: "Non autorise." }, { status: 401 });
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: params.classroomId },
    include: {
      members: { include: { user: { select: { name: true, email: true } } }, orderBy: { joinedAt: "asc" } },
      courses: { include: { course: { select: { id: true, title: true } } } },
    },
  });
  if (!classroom) return NextResponse.json({ message: "Non trouve." }, { status: 404 });
  if (session.user.role !== "admin" && classroom.ownerId !== session.user.id) return NextResponse.json({ message: "Non autorise." }, { status: 403 });

  const lessons = await prisma.lesson.findMany({
    where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
    select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } },
    orderBy: { position: "asc" },
  });

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: { in: classroom.members.map(m => m.userId) } },
  });

  const results = await prisma.activityResult.findMany({
    where: { userId: { in: classroom.members.map(m => m.userId) }, completed: true },
    include: { activity: { select: { id: true, title: true, type: true } } },
  });

  // Get unique activities
  const actMap = new Map<string, string>();
  results.forEach(r => actMap.set(r.activityId, r.activity.title));
  const activityList = Array.from(actMap.entries());

  const wb = new ExcelJS.Workbook();
  wb.creator = "FLEbyRayane";

  // ===== SHEET 1: Progression des lecons =====
  const ws1 = wb.addWorksheet("Progression");

  // Title row
  ws1.mergeCells(1, 1, 1, 3 + lessons.length);
  const titleCell = ws1.getCell(1, 1);
  titleCell.value = classroom.name + " - Progression des lecons";
  titleCell.font = { size: 14, bold: true, color: { argb: "FF4338CA" } };
  titleCell.alignment = { horizontal: "center" };

  // Header row
  const headers1 = ["N", "Eleve", "Score moy."];
  lessons.forEach(l => headers1.push(l.title));
  const headerRow1 = ws1.addRow(headers1);
  headerRow1.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
  headerRow1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
  headerRow1.alignment = { horizontal: "center", wrapText: true };
  headerRow1.height = 40;

  // Section subtitle row
  const sectionRow = ["", "", ""];
  lessons.forEach(l => sectionRow.push(l.section.title));
  const sr = ws1.addRow(sectionRow);
  sr.font = { italic: true, size: 8, color: { argb: "FF6366F1" } };
  sr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };

  // Data rows
  classroom.members.forEach((m, idx) => {
    const memberProg = progress.filter(p => p.userId === m.userId);
    const memberRes = results.filter(r => r.userId === m.userId);
    const unique = new Map<string, number>();
    memberRes.forEach(r => { const ex = unique.get(r.activityId); if (!ex || (r.score||0) > ex) unique.set(r.activityId, r.score||0); });
    const scores = Array.from(unique.values());
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const row = [idx + 1, m.user.name || "?", avg + "%"];
    lessons.forEach(l => {
      const p = memberProg.find(p => p.lessonId === l.id);
      row.push(p ? (p.status === "completed" ? "Faite" : "En cours") : "-");
    });

    const dataRow = ws1.addRow(row);
    dataRow.alignment = { horizontal: "center" };
    dataRow.getCell(2).alignment = { horizontal: "left" };

    // Color cells based on status
    for (let i = 4; i <= 3 + lessons.length; i++) {
      const cell = dataRow.getCell(i);
      const val = cell.value as string;
      if (val === "Faite") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
        cell.font = { color: { argb: "FF059669" }, bold: true, size: 9 };
      } else if (val === "En cours") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
        cell.font = { color: { argb: "FFD97706" }, bold: true, size: 9 };
      } else {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };
        cell.font = { color: { argb: "FFEF4444" }, size: 9 };
      }
    }

    // Alternate row background
    if (idx % 2 === 0) {
      dataRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      dataRow.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      dataRow.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
    }
  });

  // Column widths
  ws1.getColumn(1).width = 4;
  ws1.getColumn(2).width = 22;
  ws1.getColumn(3).width = 10;
  for (let i = 4; i <= 3 + lessons.length; i++) ws1.getColumn(i).width = 12;

  // ===== SHEET 2: Scores des activites =====
  const ws2 = wb.addWorksheet("Activites");

  ws2.mergeCells(1, 1, 1, 2 + activityList.length);
  const titleCell2 = ws2.getCell(1, 1);
  titleCell2.value = classroom.name + " - Scores des activites";
  titleCell2.font = { size: 14, bold: true, color: { argb: "FF4338CA" } };
  titleCell2.alignment = { horizontal: "center" };

  const headers2 = ["N", "Eleve"];
  activityList.forEach(([_, title]) => headers2.push(title));
  const headerRow2 = ws2.addRow(headers2);
  headerRow2.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
  headerRow2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4338CA" } };
  headerRow2.alignment = { horizontal: "center", wrapText: true };
  headerRow2.height = 40;

  classroom.members.forEach((m, idx) => {
    const memberRes = results.filter(r => r.userId === m.userId);
    const row: (string | number)[] = [idx + 1, m.user.name || "?"];
    activityList.forEach(([actId]) => {
      const best = memberRes.filter(r => r.activityId === actId).sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      row.push(best ? Math.round(best.score || 0) : "-" as any);
    });

    const dataRow = ws2.addRow(row);
    dataRow.alignment = { horizontal: "center" };
    dataRow.getCell(2).alignment = { horizontal: "left" };

    for (let i = 3; i <= 2 + activityList.length; i++) {
      const cell = dataRow.getCell(i);
      const val = cell.value;
      if (typeof val === "number") {
        cell.value = val + "%";
        if (val >= 80) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
          cell.font = { color: { argb: "FF059669" }, bold: true, size: 9 };
        } else if (val >= 50) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
          cell.font = { color: { argb: "FFD97706" }, bold: true, size: 9 };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };
          cell.font = { color: { argb: "FFEF4444" }, bold: true, size: 9 };
        }
      }
    }
  });

  ws2.getColumn(1).width = 4;
  ws2.getColumn(2).width = 22;
  for (let i = 3; i <= 2 + activityList.length; i++) ws2.getColumn(i).width = 14;

  // Generate buffer
  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=" + classroom.name.replace(/[^a-zA-Z0-9]/g, "_") + "_resultats.xlsx",
    },
  });
}