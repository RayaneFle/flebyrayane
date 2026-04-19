import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { levelColors } from "@/lib/utils";
import AddSectionForm from "./AddSectionForm";
import AssignClassForm from "./AssignClassForm";
import UnassignBtn from "./UnassignBtn";
import DeleteCourseBtn from "./DeleteCourseBtn";
import DeleteSectionBtn from "./DeleteSectionBtn";
import DeleteLessonBtn from "./DeleteLessonBtn";
import ToggleLessonBtn from "./ToggleLessonBtn";
import DuplicateLessonBtn from "./DuplicateLessonBtn";
import EditCourseForm from "./EditCourseForm";
import ReorderSectionBtns from "./ReorderSectionBtns";
import ReorderLessonBtns from "./ReorderLessonBtns";
import LessonActionsMenu from "./LessonActionsMenu";

export default async function AdminCourseEditorPage({ params }: { params: { courseId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const isAdmin = session.user.role === "admin";

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    include: {
      sections: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
            include: { _count: { select: { blocks: true } } },
          },
        },
      },
    },
  });
  if (!course) notFound();
  if (!isAdmin && course.authorId !== session.user.id) notFound();

  const classrooms = await prisma.classroom.findMany({
    where: { ownerId: session?.user?.id || "" },
    include: { courses: { select: { courseId: true } } },
  });
  const assignedClassrooms = classrooms.filter(c => c.courses.some(cc => cc.courseId === course.id));
  const availableClassrooms = classrooms.filter(c => !c.courses.some(cc => cc.courseId === course.id));

  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const totalEnrollments = await prisma.enrollment.count({ where: { courseId: course.id } });

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link href="/admin/cours" className="text-sm text-slate-500 hover:text-brand-600 transition-colors">
          ← Retour aux cours
        </Link>
      </div>

      {/* Header compact */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={"px-2.5 py-0.5 rounded-md text-xs font-bold " + (levelColors[course.level] || "")}>{course.level}</span>
              {course.published ? (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-green-100 text-green-700">Publié</span>
              ) : (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700">Brouillon</span>
              )}
              {course.enrollmentCode && (
                <span className="font-mono text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded">🔑 {course.enrollmentCode}</span>
              )}
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 truncate">{course.title}</h1>
            {course.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{course.description}</p>}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500">
              <span>📑 <b className="text-slate-700">{course.sections.length}</b> section{course.sections.length > 1 ? "s" : ""}</span>
              <span>🎓 <b className="text-slate-700">{totalLessons}</b> leçon{totalLessons > 1 ? "s" : ""}</span>
              <span>👥 <b className="text-slate-700">{totalEnrollments}</b> inscrit{totalEnrollments > 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link href={"/cours/" + course.slug} className="text-xs font-semibold px-3 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-center">
              👁 Voir
            </Link>
            <DeleteCourseBtn courseId={course.id} />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <EditCourseForm
            courseId={course.id}
            initial={{
              title: course.title,
              description: course.description || "",
              level: course.level,
              published: course.published,
              requiresEnrollment: course.requiresEnrollment,
            }}
          />
        </div>
      </div>

      {/* Sections + Leçons */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">📑 Sections et leçons</h2>
        </div>

        {course.sections.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <span className="text-4xl">📑</span>
            <p className="text-slate-500 mt-3">Aucune section pour l'instant.</p>
            <p className="text-xs text-slate-400 mt-1">Commencez par créer une section ci-dessous.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {course.sections.map((s, si) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200">
                {/* Section header */}
                <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-brand-50/50 to-accent-50/30 border-b border-slate-100 rounded-t-2xl">
                  <ReorderSectionBtns sectionId={s.id} isFirst={si === 0} isLast={si === course.sections.length - 1} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">Section {si + 1}</p>
                    <h3 className="font-heading font-bold text-slate-800 truncate">{s.title}</h3>
                    <p className="text-[11px] text-slate-400">{s.lessons.length} leçon{s.lessons.length > 1 ? "s" : ""}</p>
                  </div>
                  <DeleteSectionBtn courseId={course.id} sectionId={s.id} />
                </div>

                {/* Lessons */}
                {s.lessons.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm text-slate-400">Aucune leçon dans cette section</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {s.lessons.map((l, li) => (
                      <div key={l.id} data-lesson-row className="flex items-center gap-3 px-5 py-3 hover:bg-brand-50/30 transition-colors">
                        <ReorderLessonBtns lessonId={l.id} isFirst={li === 0} isLast={li === s.lessons.length - 1} />
                        <span className="text-xs font-semibold text-slate-400 w-10 shrink-0">{si + 1}.{li + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{l.title}</p>
                          <p className="text-[11px] text-slate-400">{l._count.blocks} bloc{l._count.blocks > 1 ? "s" : ""}</p>
                        </div>
                        <LessonActionsMenu
                          courseId={course.id}
                          sectionId={s.id}
                          lessonId={l.id}
                          hidden={(l as any).hidden || false}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add lesson button */}
                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 rounded-b-2xl">
                  <Link href={"/admin/cours/" + course.id + "/sections/" + s.id + "/lessons/new"} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors">
                    <span>+</span>
                    <span>Nouvelle leçon dans cette section</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add section form */}
        <div className="mt-4 bg-white rounded-2xl border border-dashed border-brand-300 p-5">
          <AddSectionForm courseId={course.id} />
        </div>
      </div>

      {/* Classes assignées (à la fin) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-heading font-bold text-slate-800 mb-3">🏫 Classes assignées ({assignedClassrooms.length})</h2>
        {assignedClassrooms.length > 0 && (
          <div className="space-y-2 mb-4">
            {assignedClassrooms.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3 bg-brand-50 rounded-xl">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brand-700 truncate">{c.name}</p>
                  <p className="font-mono text-[11px] text-brand-500">{c.code}</p>
                </div>
                <UnassignBtn classroomId={c.id} courseId={course.id} />
              </div>
            ))}
          </div>
        )}
        {availableClassrooms.length > 0 ? (
          <AssignClassForm courseId={course.id} classrooms={availableClassrooms} />
        ) : assignedClassrooms.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-slate-400">Aucune classe disponible</p>
            <Link href="/admin/classes" className="inline-block mt-2 text-xs text-brand-600 font-semibold">Créer une classe →</Link>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Ce cours est assigné à toutes vos classes.</p>
        )}
      </div>
    </div>
  );
}
