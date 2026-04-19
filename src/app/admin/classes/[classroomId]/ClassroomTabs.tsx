"use client";
import { useState } from "react";
import Link from "next/link";
import { activityTypeLabels, getYouTubeEmbedUrl } from "@/lib/utils";
import AssignCourseForm from "./AssignCourseForm";
import AssignActivityForm from "./AssignActivityForm";
import UnassignActivityBtn from "./UnassignActivityBtn";
import UnassignCourseBtn from "./UnassignCourseBtn";
import AddPostForm from "./AddPostForm";
import DeletePostBtn from "./DeletePostBtn";
import RemoveMemberBtn from "./RemoveMemberBtn";
import SubclassManager from "./SubclassManager";

interface Props {
  classroom: any;
  availableCourses: any[];
  availableActivities: any[];
  allLessonProgress: any[];
  studentResults: any[];
  allLessonsForTracking: any[];
}

const TABS = [
  { key: "cours", label: "Cours", icon: "📖" },
  { key: "activites", label: "Activités", icon: "🎮" },
  { key: "suivi", label: "Suivi", icon: "📊" },
  { key: "eleves", label: "Élèves", icon: "👥" },
  { key: "ressources", label: "Ressources", icon: "📌" },
];

export default function ClassroomTabs({ classroom, availableCourses, availableActivities, allLessonProgress, studentResults, allLessonsForTracking }: Props) {
  const [tab, setTab] = useState("suivi");
  const [subclassFilter, setSubclassFilter] = useState<string | null>(null);

  const filteredMembers = subclassFilter
    ? classroom.members.filter((m: any) => m.subclassId === subclassFilter)
    : classroom.members;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={"flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap " +
              (tab === t.key ? "bg-white text-brand-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-700")}>
            <span>{t.icon}</span>{t.label}
            {t.key === "cours" && <span className="text-xs text-slate-400 ml-1">({classroom.courses.length})</span>}
            {t.key === "activites" && <span className="text-xs text-slate-400 ml-1">({classroom.activities.length})</span>}
            {t.key === "eleves" && <span className="text-xs text-slate-400 ml-1">({classroom.members.length})</span>}
            {t.key === "ressources" && <span className="text-xs text-slate-400 ml-1">({classroom.posts.length})</span>}
          </button>
        ))}
      </div>

      {/* COURS TAB */}
      {tab === "cours" && (
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Cours assignés</h2>
          {classroom.courses.length > 0 ? (
            <div className="space-y-2 mb-6">{classroom.courses.map((cc: any) => (
              <div key={cc.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-xl">
                <Link href={"/cours/" + cc.course.slug} className="font-medium text-brand-700 hover:text-brand-800 text-sm">{cc.course.title}</Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded">{cc.course.level}</span>
                  <UnassignCourseBtn classroomId={classroom.id} courseId={cc.course.id} />
                </div>
              </div>
            ))}</div>
          ) : <p className="text-sm text-slate-400 mb-4">Aucun cours assigné.</p>}
          <AssignCourseForm classroomId={classroom.id} courses={availableCourses} />
          <a href="/admin/cours/creer" target="_blank" className="inline-block mt-3 text-xs text-brand-600 font-medium hover:text-brand-700">+ Créer un cours</a>
        </div>
      )}

      {/* ACTIVITES TAB */}
      {tab === "activites" && (
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Activités assignées</h2>
          {classroom.activities.length > 0 ? (
            <div className="space-y-2 mb-6">{classroom.activities.map((ca: any) => {
              const t = activityTypeLabels[ca.activity.type] || { emoji: "?", label: ca.activity.type };
              return (
                <div key={ca.id} className="flex items-center justify-between p-3 bg-brand-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span>{t.emoji}</span>
                    <Link href={"/activites/" + ca.activity.id} className="font-medium text-brand-700 hover:text-brand-800 text-sm">{ca.activity.title}</Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{ca.activity.level || ""}</span>
                    <UnassignActivityBtn classroomId={classroom.id} activityId={ca.activity.id} />
                  </div>
                </div>
              );
            })}</div>
          ) : <p className="text-sm text-slate-400 mb-4">Aucune activité assignée.</p>}
          <AssignActivityForm classroomId={classroom.id} activities={availableActivities} />
          <a href="/admin/activites/creer" target="_blank" className="inline-block mt-3 text-xs text-brand-600 font-medium hover:text-brand-700">+ Créer une activité</a>
        </div>
      )}

      {/* SUIVI TAB */}
      {tab === "suivi" && (
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg text-slate-900">Suivi des élèves</h2>
            {classroom.subclasses.length > 0 && (
              <div className="flex gap-1">
                <button onClick={() => setSubclassFilter(null)} className={"px-3 py-1 rounded-lg text-xs font-medium transition-all " + (!subclassFilter ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>Tous</button>
                {classroom.subclasses.map((sc: any) => (
                  <button key={sc.id} onClick={() => setSubclassFilter(sc.id)} className={"px-3 py-1 rounded-lg text-xs font-medium transition-all " + (subclassFilter === sc.id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>{sc.name}</button>
                ))}
              </div>
            )}
          </div>
          {filteredMembers.length === 0 ? <p className="text-sm text-slate-400">Aucun élève.</p> :
            <div className="space-y-3">{filteredMembers.map((m: any) => {
              const memberProgress = allLessonProgress.filter((p: any) => p.userId === m.userId);
              const memberResults = studentResults.filter((r: any) => r.user.id === m.userId);
              const completedCount = allLessonsForTracking.filter((l: any) => memberProgress.find((p: any) => p.lessonId === l.id && p.status === "completed")).length;
              const inProgressCount = allLessonsForTracking.filter((l: any) => memberProgress.find((p: any) => p.lessonId === l.id && p.status === "in_progress")).length;
              const uniqueResults = new Map();
              memberResults.forEach((r: any) => { const ex = uniqueResults.get(r.activityId); if (!ex || (r.score || 0) > (ex.score || 0)) uniqueResults.set(r.activityId, r); });
              const dedupedResults = Array.from(uniqueResults.values());
              const avgScore = dedupedResults.length > 0 ? dedupedResults.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / dedupedResults.length : 0;
              const scName = classroom.subclasses.find((sc: any) => sc.id === m.subclassId)?.name;

              return (
                <details key={m.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-brand-200 transition-colors">
                  <summary className="px-4 py-3 cursor-pointer bg-slate-50 hover:bg-brand-50/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{m.user.name?.charAt(0) || "?"}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{m.user.name}{scName && <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded ml-1.5 font-medium">{scName}</span>}</p>
                        <p className="text-[11px] text-slate-400 truncate">{m.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">{completedCount}/{allLessonsForTracking.length}</span>
                      {inProgressCount > 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">{inProgressCount} en cours</span>}
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">{Math.round(avgScore)}%</span>
                    </div>
                  </summary>
                  <div className="px-4 py-4 bg-white border-t border-slate-100 space-y-4">
                    {allLessonsForTracking.length > 0 && (() => {
                      const grouped: Record<string, any[]> = {};
                      allLessonsForTracking.forEach((l: any) => { if (!grouped[l.sectionTitle]) grouped[l.sectionTitle] = []; grouped[l.sectionTitle].push(l); });
                      return (
                        <div>
                          <p className="text-xs font-bold text-slate-600 mb-2">Lecons</p>
                          <div className="space-y-2">{Object.entries(grouped).map(([section, lessons]) => {
                            const done = lessons.filter((l: any) => memberProgress.find((p: any) => p.lessonId === l.id && p.status === "completed")).length;
                            return (
                              <details key={section} className="bg-slate-50 rounded-lg border border-slate-100">
                                <summary className="flex items-center justify-between px-3 py-2 cursor-pointer text-xs">
                                  <span className="font-bold text-brand-800">{section}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-14 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{width: (done/lessons.length*100)+"%"}} /></div>
                                    <span className="text-slate-500 font-medium w-6 text-right">{done}/{lessons.length}</span>
                                  </div>
                                </summary>
                                <div className="px-2 pb-2 space-y-0.5">{lessons.map((l: any) => {
                                  const p = memberProgress.find((p: any) => p.lessonId === l.id);
                                  const st = p ? p.status : "not_started";
                                  return (
                                    <div key={l.id} className="flex items-center justify-between py-1 px-2 bg-white rounded">
                                      <span className="text-[11px] text-slate-700 truncate flex-1">{l.title}</span>
                                      <span className={"text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 " + (st === "completed" ? "bg-green-500 text-white" : st === "in_progress" ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-400")}>{st === "completed" ? "Faite" : st === "in_progress" ? "En cours" : "A faire"}</span>
                                    </div>
                                  );
                                })}</div>
                              </details>
                            );
                          })}</div>
                        </div>
                      );
                    })()}
                    {dedupedResults.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-600 mb-2">Activites ({dedupedResults.length})</p>
                        <div className="bg-slate-50 rounded-lg border border-slate-100 p-2 space-y-0.5">{dedupedResults.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between py-1 px-2 bg-white rounded">
                            <span className="text-[11px] text-slate-700 truncate flex-1"><span className="mr-1">{(activityTypeLabels[r.activity.type] || {emoji:"?"}).emoji}</span>{r.activity.title}</span>
                            <span className={"text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 " + ((r.score || 0) >= 80 ? "bg-green-500 text-white" : (r.score || 0) >= 50 ? "bg-amber-400 text-white" : "bg-red-400 text-white")}>{Math.round(r.score || 0)}%</span>
                          </div>
                        ))}</div>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}</div>
          }
        </div>
      )}

      {/* ELEVES TAB */}
      {tab === "eleves" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-brand-100 p-6">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Sous-classes</h2>
            <SubclassManager classroomId={classroom.id} members={classroom.members} subclasses={classroom.subclasses} />
          </div>
          <div className="bg-white rounded-2xl border border-brand-100 p-6">
            <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Tous les élèves ({classroom.members.length})</h2>
            <div className="space-y-2">
              {classroom.subclasses.map((sc: any) => {
                const scMembers = classroom.members.filter((m: any) => m.subclassId === sc.id);
                if (scMembers.length === 0) return null;
                return (
                  <details key={sc.id} open className="border border-brand-100 rounded-xl overflow-hidden">
                    <summary className="px-4 py-2.5 bg-brand-50 cursor-pointer flex items-center justify-between">
                      <span className="text-sm font-bold text-brand-800">{sc.name}</span>
                      <span className="text-xs text-slate-400">{scMembers.length}</span>
                    </summary>
                    <div className="p-2 space-y-0.5">{scMembers.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2 py-1.5 px-3 hover:bg-slate-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 text-[10px] font-bold shrink-0">{m.user.name?.charAt(0) || "?"}</div>
                        <div className="flex-1 min-w-0"><span className="text-xs text-slate-700">{m.user.name}</span> <span className="text-[10px] text-slate-400">{m.user.email}</span></div>
                        <RemoveMemberBtn classroomId={classroom.id} userId={m.userId} />
                      </div>
                    ))}</div>
                  </details>
                );
              })}
              {(() => {
                const unassigned = classroom.members.filter((m: any) => !classroom.subclasses.some((sc: any) => sc.id === m.subclassId));
                if (unassigned.length === 0 && classroom.subclasses.length > 0) return null;
                return (
                  <details open={classroom.subclasses.length === 0} className="border border-slate-200 rounded-xl overflow-hidden">
                    <summary className="px-4 py-2.5 bg-slate-50 cursor-pointer flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600">{classroom.subclasses.length > 0 ? "Non assignés" : "Eleves"}</span>
                      <span className="text-xs text-slate-400">{unassigned.length}</span>
                    </summary>
                    <div className="p-2 space-y-0.5">{unassigned.map((m: any) => (
                      <div key={m.id} className="flex items-center gap-2 py-1.5 px-3 hover:bg-slate-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold shrink-0">{m.user.name?.charAt(0) || "?"}</div>
                        <div className="flex-1 min-w-0"><span className="text-xs text-slate-700">{m.user.name}</span> <span className="text-[10px] text-slate-400">{m.user.email}</span></div>
                        <RemoveMemberBtn classroomId={classroom.id} userId={m.userId} />
                      </div>
                    ))}</div>
                  </details>
                );
              })()}
            </div>
          </div>
          <div className="bg-brand-50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Code a partager aux eleves :</p>
            <p className="font-mono font-bold text-2xl text-brand-700 tracking-widest">{classroom.code}</p>
          </div>
        </div>
      )}

      {/* RESSOURCES TAB */}
      {tab === "ressources" && (
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <h2 className="font-heading font-bold text-lg text-slate-900 mb-4">Ressources</h2>
          <AddPostForm classroomId={classroom.id} />
          <div className="mt-4 space-y-3">
            {classroom.posts.length === 0 ? <p className="text-sm text-slate-400">Aucune publication.</p> :
              classroom.posts.map((p: any) => (
                <div key={p.id} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-slate-800 text-sm">{p.title || "Publication"}</span>
                    <span className="text-xs text-slate-400 ml-auto">{p.author.name}</span>
                    <DeletePostBtn classroomId={classroom.id} postId={p.id} />
                  </div>
                  {p.content && <p className="text-sm text-slate-600 mb-2">{p.content}</p>}
                  {getYouTubeEmbedUrl(p.videoUrl) && <div className="rounded-lg overflow-hidden bg-black"><iframe src={getYouTubeEmbedUrl(p.videoUrl) || ""} className="w-full aspect-video" allowFullScreen /></div>}
                  {p.fileUrl && <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-4 py-2 rounded-lg mt-2">{p.fileName || "Fichier"}</a>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}