import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { activityTypeLabels } from "@/lib/utils";
import AssignCourseForm from "./AssignCourseForm";
import AssignActivityForm from "./AssignActivityForm";
import UnassignActivityBtn from "./UnassignActivityBtn";
import UnassignCourseBtn from "./UnassignCourseBtn";
import AddPostForm from "./AddPostForm";
import DeletePostBtn from "./DeletePostBtn";
import RemoveMemberBtn from "./RemoveMemberBtn";

export default async function ClassroomDetailPage({ params }: { params: { classroomId: string } }) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: params.classroomId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { joinedAt: "desc" } },
      courses: { include: { course: { select: { id: true, title: true, slug: true, level: true } } } },
      activities: { include: { activity: { select: { id: true, title: true, type: true, level: true } } } },
      posts: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!classroom) notFound();

  const allCourses = await prisma.course.findMany({ where: { published: true }, select: { id: true, title: true, level: true } });
  const assignedCourseIds = new Set(classroom.courses.map(c => c.courseId));
  const availableCourses = allCourses.filter(c => !assignedCourseIds.has(c.id));

  const allActivities = await prisma.activity.findMany({ where: { isPublic: true }, select: { id: true, title: true, type: true, level: true } });
  const assignedActivityIds = new Set(classroom.activities.map(a => a.activityId));
  const availableActivities = allActivities.filter(a => !assignedActivityIds.has(a.id));

  // Get lesson progress for all students
  const allLessonProgress = await prisma.lessonProgress.findMany({
    where: { userId: { in: classroom.members.map(m => m.userId) } },
    include: { 
      user: { select: { id: true, name: true } },
      lesson: { select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } } },
    },
  });

  const studentResults = await prisma.activityResult.findMany({
    where: { userId: { in: classroom.members.map(m => m.userId) }, completed: true },
    include: { user: { select: { id: true, name: true } }, activity: { select: { id: true, title: true } } },
    orderBy: { completedAt: "desc" },
  });

  // Get all lessons from assigned courses
  const assignedCourseLessons = await prisma.lesson.findMany({
    where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
    select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } },
    orderBy: { position: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/classes" className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block">\u2190 Mes classes</Link>
          <h1 className="font-heading text-2xl font-bold text-slate-900">{classroom.name}</h1>
          {classroom.description && <p className="text-slate-400 mt-1">{classroom.description}</p>}
        </div>
        <span className="px-4 py-2 bg-brand-100 text-brand-700 font-mono font-bold text-lg rounded-xl tracking-widest">{classroom.code}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          <details open className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">\ud83d\udcd6 Cours assignes ({classroom.courses.length})</summary>
            <div className="p-6">
              {classroom.courses.length > 0 && (
                <div className="space-y-2 mb-4">{classroom.courses.map(cc => (
                  <div key={cc.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-xl">
                    <Link href={`/cours/${cc.course.slug}`} className="font-medium text-brand-700 hover:text-brand-800 text-sm">{cc.course.title}</Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{cc.course.level}</span>
                      <UnassignCourseBtn classroomId={classroom.id} courseId={cc.course.id} />
                    </div>
                  </div>
                ))}</div>
              )}
              <AssignCourseForm classroomId={classroom.id} courses={availableCourses} />
              <a href="/admin/cours/creer" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-brand-600 font-medium hover:text-brand-700">+ Creer un cours</a>
            </div>
          </details>

          <details open className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">\ud83c\udfae Activites assignees ({classroom.activities.length})</summary>
            <div className="p-6">
              {classroom.activities.length > 0 && (
                <div className="space-y-2 mb-4">{classroom.activities.map(ca => {
                  const t = activityTypeLabels[ca.activity.type] || { emoji: "?", label: ca.activity.type };
                  // Get all lessons from assigned courses
  const assignedCourseLessons = await prisma.lesson.findMany({
    where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
    select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } },
    orderBy: { position: "asc" },
  });

  return (
                    <div key={ca.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span>{t.emoji}</span>
                        <Link href={`/activites/${ca.activity.id}`} className="font-medium text-brand-700 hover:text-brand-800 text-sm">{ca.activity.title}</Link>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{ca.activity.level || ""}</span>
                        <UnassignActivityBtn classroomId={classroom.id} activityId={ca.activity.id} />
                      </div>
                    </div>
                  );
                })}</div>
              )}
              <AssignActivityForm classroomId={classroom.id} activities={availableActivities} />
              <a href="/admin/activites/creer" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-brand-600 font-medium hover:text-brand-700">+ Creer une activite</a>
            </div>
          </details>

          <details className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">\ud83d\udccc Ressources ({classroom.posts.length})</summary>
            <div className="p-6">
              <AddPostForm classroomId={classroom.id} />
              <div className="mt-4 space-y-3">
                {classroom.posts.length === 0 ? <p className="text-sm text-slate-400">Aucune publication.</p> :
                  classroom.posts.map(p => (
                    <div key={p.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{p.type === "video" ? "\ud83c\udfac" : p.type === "pdf" ? "\ud83d\udcc4" : p.type === "link" ? "\ud83d\udd17" : "\ud83d\udcdd"}</span>
                        <span className="font-medium text-slate-800 text-sm">{p.title || "Publication"}</span>
                        <span className="text-xs text-slate-400 ml-auto">{p.author.name} \u00b7 {new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                      <DeletePostBtn classroomId={classroom.id} postId={p.id} />
                      </div>
                      {p.content && <p className="text-sm text-slate-600 mb-2">{p.content}</p>}
                      {p.videoUrl && <div className="rounded-lg overflow-hidden bg-black"><iframe src={p.videoUrl.replace("watch?v=","embed/")} className="w-full aspect-video" allowFullScreen /></div>}
                      {p.fileUrl && <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 bg-brand-50 px-4 py-2 rounded-lg mt-2">\ud83d\udcc4 {p.fileName || "Fichier"}</a>}
                    </div>
                  ))}
              </div>
            </div>
          </details>

          <details open className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">Suivi des eleves</summary>
            <div className="p-6">
              {classroom.members.length === 0 ? <p className="text-sm text-slate-400">Aucun eleve.</p> :
                <div className="space-y-4">{classroom.members.map(m => {
                  const memberProgress = allLessonProgress.filter(p => p.userId === m.userId);
                  const memberResults = studentResults.filter(r => r.user.id === m.userId);
                  const allLessons = assignedCourseLessons.map(l => ({ id: l.id, title: l.title, sectionTitle: l.section.title, courseTitle: l.section.course.title }));
                  const completedLessons = allLessons.filter(l => memberProgress.find(p => p.lessonId === l.id && p.status === "completed")).length;
                  const inProgressLessons = allLessons.filter(l => memberProgress.find(p => p.lessonId === l.id && p.status === "in_progress")).length;
                  const notStartedLessons = allLessons.length - completedLessons - inProgressLessons;
                  const avgScore = memberResults.length > 0 ? memberResults.reduce((sum, r) => sum + (r.score || 0), 0) / memberResults.length : 0;
                  // Get all lessons from assigned courses
  const assignedCourseLessons = await prisma.lesson.findMany({
    where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
    select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } },
    orderBy: { position: "asc" },
  });

  return (
                    <details key={m.id} className="border border-slate-100 rounded-xl overflow-hidden">
                      <summary className="px-4 py-3 cursor-pointer hover:bg-brand-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-300 to-accent-400 flex items-center justify-center text-white text-xs font-bold">{m.user.name?.charAt(0)||"?"}</div>
                          <div><p className="text-sm font-medium text-slate-800">{m.user.name}</p><p className="text-xs text-slate-400">{m.user.email}</p></div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-green-600 font-bold">{completedLessons}/{allLessons.length} faites</span>
                          <span className="text-amber-500 font-bold">{inProgressLessons} en cours</span>
                          <span className="text-red-400 font-bold">{notStartedLessons} restantes</span>
                          <span className="text-brand-600 font-bold">{Math.round(avgScore)}%</span>
                        </div>
                      </summary>
                      <div className="px-4 pb-4 border-t border-slate-50">
                        {memberProgress.length === 0 && memberResults.length === 0 ? (
                          <p className="text-xs text-slate-400 py-3">Aucune activite.</p>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {allLessons.length > 0 && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 mb-2">Lecons :</p>
                                <div className="space-y-1">{allLessons.map(l => {
                                  const prog = memberProgress.find(p => p.lessonId === l.id);
                                  const status = prog ? prog.status : "not_started";
                                  // Get all lessons from assigned courses
  const assignedCourseLessons = await prisma.lesson.findMany({
    where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
    select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } },
    orderBy: { position: "asc" },
  });

  return (
                                    <div key={l.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-slate-700 truncate">{l.title}</p>
                                        <p className="text-[10px] text-slate-400">{l.courseTitle} &gt; {l.sectionTitle}</p>
                                      </div>
                                      <span className={"text-xs font-bold shrink-0 ml-2 px-2 py-0.5 rounded-lg " + (status === "completed" ? "bg-green-100 text-green-700" : status === "in_progress" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>{status === "completed" ? "Faite" : status === "in_progress" ? "En cours" : "Non faite"}</span>
                                    </div>
                                  );
                                })}</div>
                              </div>
                            )}
                            {memberResults.length > 0 && (() => {
                              const uniqueActs = new Map();
                              memberResults.forEach(r => {
                                const existing = uniqueActs.get(r.activityId);
                                if (!existing || (r.score||0) > (existing.score||0)) uniqueActs.set(r.activityId, r);
                              });
                              const acts = Array.from(uniqueActs.values());
                              // Get all lessons from assigned courses
  const assignedCourseLessons = await prisma.lesson.findMany({
    where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
    select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } },
    orderBy: { position: "asc" },
  });

  return (
                              <div>
                                <p className="text-xs font-bold text-slate-500 mb-2">Activites ({acts.length}) :</p>
                                <div className="space-y-1">{acts.map(r => (
                                  <div key={r.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                                    <p className="text-xs text-slate-700 truncate flex-1">{r.activity.title}</p>
                                    <span className={"text-xs font-bold ml-2 " + ((r.score||0) >= 60 ? "text-green-600" : "text-amber-500")}>{Math.round(r.score||0)}%</span>
                                  </div>
                                ))}</div>
                              </div>);})()
                            )}
                          </div>
                        )}
                      </div>
                    </details>
                  );
                })}</div>}
            </div>
          </details>
        </div>

        <div>
          <div className="bg-white rounded-2xl border border-brand-100 p-6 sticky top-24">
            <h2 className="font-heading font-bold text-slate-800 mb-4">\ud83d\udc65 Eleves ({classroom.members.length})</h2>
            {classroom.members.length === 0 ? <p className="text-sm text-slate-400">Aucun eleve.</p> :
              <div className="space-y-2">{classroom.members.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-300 to-accent-400 flex items-center justify-center text-white text-xs font-bold">{m.user.name?.charAt(0)||"?"}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-700 truncate">{m.user.name}</p><p className="text-xs text-slate-400">{m.user.email}</p></div>
                  <RemoveMemberBtn classroomId={classroom.id} userId={m.userId} />
                </div>
              ))}</div>}
            <div className="mt-4 p-3 bg-brand-50 rounded-xl text-center">
              <p className="text-xs text-slate-500">Code a partager :</p>
              <p className="font-mono font-bold text-lg text-brand-700 tracking-widest">{classroom.code}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}