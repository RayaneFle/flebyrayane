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

  const allLessonProgress = await prisma.lessonProgress.findMany({
    where: { userId: { in: classroom.members.map(m => m.userId) } },
    include: { lesson: { select: { id: true, title: true } } },
  });

  const studentResults = await prisma.activityResult.findMany({
    where: { userId: { in: classroom.members.map(m => m.userId) }, completed: true },
    include: { user: { select: { id: true, name: true } }, activity: { select: { id: true, title: true, type: true } } },
  });

  const assignedCourseLessons = await prisma.lesson.findMany({
    where: { section: { courseId: { in: classroom.courses.map(c => c.courseId) } } },
    select: { id: true, title: true, section: { select: { title: true, course: { select: { title: true } } } } },
    orderBy: { position: "asc" },
  });

  const allLessonsForTracking = assignedCourseLessons.map(l => ({
    id: l.id, title: l.title, sectionTitle: l.section.title, courseTitle: l.section.course.title,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/classes" className="text-sm text-brand-600 hover:text-brand-700 mb-2 inline-block">← Mes classes</Link>
          <h1 className="font-heading text-2xl font-bold text-slate-900">{classroom.name}</h1>
          {classroom.description && <p className="text-slate-400 mt-1">{classroom.description}</p>}
        </div>
        <span className="px-4 py-2 bg-brand-100 text-brand-700 font-mono font-bold text-lg rounded-xl tracking-widest">{classroom.code}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          <details open className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">📖 Cours assignés ({classroom.courses.length})</summary>
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
              <a href="/admin/cours/creer" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-brand-600 font-medium hover:text-brand-700">+ Créer un cours</a>
            </div>
          </details>

          <details open className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">🎮 Activités assignées ({classroom.activities.length})</summary>
            <div className="p-6">
              {classroom.activities.length > 0 && (
                <div className="space-y-2 mb-4">{classroom.activities.map(ca => {
                  const t = activityTypeLabels[ca.activity.type] || { emoji: "?", label: ca.activity.type };
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
              <a href="/admin/activites/creer" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-brand-600 font-medium hover:text-brand-700">+ Créer une activité</a>
            </div>
          </details>

          <details className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
            <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">📌 Ressources ({classroom.posts.length})</summary>
            <div className="p-6">
              <AddPostForm classroomId={classroom.id} />
              <div className="mt-4 space-y-3">
                {classroom.posts.length === 0 ? <p className="text-sm text-slate-400">Aucune publication.</p> :
                  classroom.posts.map(p => (
                    <div key={p.id} className="p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-800 text-sm">{p.title || "Publication"}</span>
                        <span className="text-xs text-slate-400 ml-auto">{p.author.name} · {new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                        <DeletePostBtn classroomId={classroom.id} postId={p.id} />
                      </div>
                      {p.content && <p className="text-sm text-slate-600 mb-2">{p.content}</p>}
                      {p.videoUrl && <div className="rounded-lg overflow-hidden bg-black"><iframe src={p.videoUrl.replace("watch?v=","embed/")} className="w-full aspect-video" allowFullScreen /></div>}
                      {p.fileUrl && <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 bg-brand-50 px-4 py-2 rounded-lg mt-2">📄 {p.fileName || "Fichier"}</a>}
                    </div>
                  ))}
              </div>
            </div>
          </details>

          <details open className="bg-white rounded-2xl border-2 border-brand-200 overflow-hidden">
            <summary className="px-6 py-4 bg-gradient-to-r from-brand-100 to-accent-100 border-b-2 border-brand-200 cursor-pointer font-heading text-lg font-bold text-slate-900 select-none">📊 Suivi des élèves</summary>
            <div className="p-6">
              {classroom.members.length === 0 ? <p className="text-sm text-slate-400">Aucun élève.</p> :
                <div className="space-y-4">{classroom.members.map(m => {
                  const memberProgress = allLessonProgress.filter(p => p.userId === m.userId);
                  const memberResults = studentResults.filter(r => r.user.id === m.userId);
                  const completedCount = allLessonsForTracking.filter(l => memberProgress.find(p => p.lessonId === l.id && p.status === "completed")).length;
                  const inProgressCount = allLessonsForTracking.filter(l => memberProgress.find(p => p.lessonId === l.id && p.status === "in_progress")).length;
                  const notStartedCount = allLessonsForTracking.length - completedCount - inProgressCount;
                  const uniqueResults = new Map<string, typeof memberResults[0]>();
                  memberResults.forEach(r => {
                    const ex = uniqueResults.get(r.activityId);
                    if (!ex || (r.score || 0) > (ex.score || 0)) uniqueResults.set(r.activityId, r);
                  });
                  const dedupedResults = Array.from(uniqueResults.values());
                  const avgScore = dedupedResults.length > 0 ? dedupedResults.reduce((sum, r) => sum + (r.score || 0), 0) / dedupedResults.length : 0;
                  return (
                    <details key={m.id} className="border-2 border-slate-200 rounded-xl overflow-hidden hover:border-brand-200 transition-colors">
                      <summary className="px-4 py-3 cursor-pointer bg-slate-50 hover:bg-brand-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">{m.user.name?.charAt(0) || "?"}</div>
                          <div><p className="text-sm font-bold text-slate-900">{m.user.name}</p><p className="text-[11px] text-slate-400">{m.user.email}</p></div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg font-bold">{completedCount}/{allLessonsForTracking.length} lecons</span>
                          {inProgressCount > 0 && <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg font-bold">{inProgressCount} en cours</span>}
                          <span className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-bold">Moy. {Math.round(avgScore)}%</span>
                        </div>
                      </summary>
                      <div className="px-4 pb-4 border-t border-slate-50 mt-2">
                        {allLessonsForTracking.length === 0 && dedupedResults.length === 0 ? (
                          <p className="text-xs text-slate-400 py-3">Aucun cours assigné.</p>
                        ) : (
                          <div className="space-y-3">
                            {allLessonsForTracking.length > 0 && (() => {
                              const grouped: Record<string, typeof allLessonsForTracking> = {};
                              allLessonsForTracking.forEach(l => {
                                const key = l.sectionTitle;
                                if (!grouped[key]) grouped[key] = [];
                                grouped[key].push(l);
                              });
                              return (
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">Progression des lecons</h4>
                                <div className="space-y-4">{Object.entries(grouped).map(([section, lessons]) => {
                                  const sectionDone = lessons.filter(l => memberProgress.find(p => p.lessonId === l.id && p.status === "completed")).length;
                                  return (
                                  <div key={section} className="bg-slate-50 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-xs font-bold text-brand-700">{section}</p>
                                      <span className="text-[10px] text-slate-400 font-medium">{sectionDone}/{lessons.length}</span>
                                    </div>
                                    <div className="space-y-1">{lessons.map(l => {
                                      const prog = memberProgress.find(p => p.lessonId === l.id);
                                      const st = prog ? prog.status : "not_started";
                                      return (
                                        <div key={l.id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg">
                                          <p className="text-xs text-slate-700 truncate flex-1">{l.title}</p>
                                          <span className={"text-[10px] font-bold shrink-0 ml-2 px-2 py-0.5 rounded-full " + (st === "completed" ? "bg-green-500 text-white" : st === "in_progress" ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500")}>{st === "completed" ? "Faite" : st === "in_progress" ? "En cours" : "A faire"}</span>
                                        </div>
                                      );
                                    })}</div>
                                  </div>);
                                })}</div>
                              </div>);})()
                            }
                            {dedupedResults.length > 0 && (
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200">Activites ({dedupedResults.length})</h4>
                                <div className="bg-slate-50 rounded-xl p-3 space-y-1">{dedupedResults.map(r => (
                                  <div key={r.id} className="flex items-center justify-between py-1.5 px-3 bg-white rounded-lg">
                                    <p className="text-xs text-slate-700 truncate flex-1"><span className="mr-1">{(activityTypeLabels[r.activity.type] || {emoji:"?"}).emoji}</span>{r.activity.title}</p>
                                    <span className={"text-[10px] font-bold ml-2 px-2 py-0.5 rounded-full " + ((r.score || 0) >= 80 ? "bg-green-500 text-white" : (r.score || 0) >= 50 ? "bg-amber-400 text-white" : "bg-red-400 text-white")}>{Math.round(r.score || 0)}%</span>
                                  </div>
                                ))}</div>
                              </div>
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
            <h2 className="font-heading font-bold text-slate-800 mb-4">👥 Élèves ({classroom.members.length})</h2>
            {classroom.members.length === 0 ? <p className="text-sm text-slate-400">Aucun élève.</p> :
              <div className="space-y-2">{classroom.members.map(m => (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-300 to-accent-400 flex items-center justify-center text-white text-xs font-bold">{m.user.name?.charAt(0) || "?"}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-700 truncate">{m.user.name}</p><p className="text-xs text-slate-400">{m.user.email}</p></div>
                  <RemoveMemberBtn classroomId={classroom.id} userId={m.userId} />
                </div>
              ))}</div>}
            <div className="mt-4 p-3 bg-brand-50 rounded-xl text-center">
              <p className="text-xs text-slate-500">Code à partager :</p>
              <p className="font-mono font-bold text-lg text-brand-700 tracking-widest">{classroom.code}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
