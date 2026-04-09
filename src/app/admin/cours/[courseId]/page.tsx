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

export default async function AdminCourseEditorPage({ params }: { params: { courseId: string } }) {
  const course = await prisma.course.findUnique({ where: { id: params.courseId }, include: { sections: { orderBy: { position: "asc" }, include: { lessons: { orderBy: { position: "asc" }, include: { _count: { select: { blocks: true } } }, select: { id: true, title: true, position: true, publishAt: true, _count: { select: { blocks: true } } } } } } } });
  if (!course) notFound();

  const session = await getServerSession(authOptions);
  const classrooms = await prisma.classroom.findMany({
    where: { ownerId: session?.user?.id || "" },
    include: { courses: { select: { courseId: true } } },
  });
  const assignedClassrooms = classrooms.filter(c => c.courses.some(cc => cc.courseId === course.id));
  const availableClassrooms = classrooms.filter(c => !c.courses.some(cc => cc.courseId === course.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${levelColors[course.level]}`}>{course.level}</span>
            {course.enrollmentCode && <span className="font-mono text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded">Code: {course.enrollmentCode}</span>}
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">{course.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/cours/${course.slug}`} className="text-sm text-brand-600 hover:text-brand-700 font-medium px-4 py-2 bg-brand-50 rounded-xl">Voir</Link>
          <DeleteCourseBtn courseId={course.id} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-100 p-6 mb-6">
        <h2 className="font-heading font-bold text-slate-800 mb-4">Classes assignees</h2>
        {assignedClassrooms.length > 0 && (
          <div className="space-y-2 mb-4">{assignedClassrooms.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-xl">
              <span className="text-sm font-medium text-brand-700">{c.name} <span className="font-mono text-xs text-brand-500">({c.code})</span></span>
              <UnassignBtn classroomId={c.id} courseId={course.id} />
            </div>
          ))}</div>
        )}
        {availableClassrooms.length > 0 && <AssignClassForm courseId={course.id} classrooms={availableClassrooms} />}
        {classrooms.length === 0 && <p className="text-xs text-slate-400">Aucune classe. <Link href="/admin/classes" className="text-brand-600">Creer une classe</Link></p>}
      </div>

      <div className="space-y-4 mb-6">
        {course.sections.map((s, si) => (
          <div key={s.id} className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 flex items-center justify-between">
              <h2 className="font-heading font-bold text-slate-800">Section {si+1} - {s.title}</h2>
              <div className="flex items-center gap-2"><Link href={`/admin/cours/${course.id}/sections/${s.id}/lessons/new`} className="text-xs px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg hover:bg-brand-200 font-medium">+ Lecon</Link><DeleteSectionBtn courseId={course.id} sectionId={s.id} /></div>
            </div>
            {s.lessons.length === 0 ? <p className="px-6 py-6 text-center text-slate-300 text-sm">Aucune lecon.</p> :
              <div className="divide-y divide-slate-50">{s.lessons.map((l, li) => (
                <div key={l.id} className="flex items-center gap-4 px-6 py-3 hover:bg-brand-50/50">
                  <span className="text-sm font-medium text-slate-300 w-8">{si+1}.{li+1}</span>
                  <p className="flex-1 font-medium text-slate-700">{l.title}</p>
                  <span className="text-xs text-slate-400">{l._count.blocks} blocs</span>
                  <Link href={`/admin/cours/${course.id}/sections/${s.id}/lessons/${l.id}/modifier`} className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100">Modifier</Link><DeleteLessonBtn courseId={course.id} sectionId={s.id} lessonId={l.id} />
                </div>
              ))}</div>}
          </div>
        ))}
      </div>
      <AddSectionForm courseId={course.id} />
    </div>
  );
}