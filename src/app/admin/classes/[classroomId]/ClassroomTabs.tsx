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

export default function ClassroomTabs({ classroom, availableCourses, availableActivities, allLessonProgress, studentResults, allLessonsForTracking }: Props) {
  const [tab, setTab] = useState("suivi");
  const [subclassFilter, setSubclassFilter] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [showSubclasses, setShowSubclasses] = useState(false);

  const filteredMembers = subclassFilter
    ? classroom.members.filter((m: any) => m.subclassId === subclassFilter)
    : classroom.members;

  const TABS = [
    { key: "suivi", label: "Suivi", icon: "📊", count: classroom.members.length },
    { key: "cours", label: "Cours", icon: "📚", count: classroom.courses.length },
    { key: "activites", label: "Activités", icon: "🎮", count: classroom.activities.length },
    { key: "eleves", label: "Élèves", icon: "👥", count: classroom.members.length },
    { key: "ressources", label: "Ressources", icon: "📌", count: classroom.posts.length },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={"inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap " +
              (tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-800")}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span className={"text-xs " + (tab === t.key ? "text-slate-400" : "text-slate-400")}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* SUIVI TAB */}
      {tab === "suivi" && (
        <div>
          {/* Filter par sous-classe */}
          {classroom.subclasses.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Filtrer:</span>
              <button
                onClick={() => setSubclassFilter(null)}
                className={"text-xs font-semibold px-3 py-1.5 rounded-full transition-all " + (!subclassFilter ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
              >
                Tous ({classroom.members.length})
              </button>
              {classroom.subclasses.map((sc: any) => {
                const count = classroom.members.filter((m: any) => m.subclassId === sc.id).length;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setSubclassFilter(sc.id)}
                    className={"text-xs font-semibold px-3 py-1.5 rounded-full transition-all " + (subclassFilter === sc.id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
                  >
                    {sc.name} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {filteredMembers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <span className="text-4xl">👥</span>
              <p className="text-slate-500 mt-3">Aucun élève dans cette sélection.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((m: any) => {
                const memberProgress = allLessonProgress.filter((p: any) => p.userId === m.userId);
                const memberResults = studentResults.filter((r: any) => r.user.id === m.userId);
                const completedCount = allLessonsForTracking.filter((l: any) => memberProgress.find((p: any) => p.lessonId === l.id && p.status === "completed")).length;
                const inProgressCount = allLessonsForTracking.filter((l: any) => memberProgress.find((p: any) => p.lessonId === l.id && p.status === "in_progress")).length;
                const uniqueResults = new Map();
                memberResults.forEach((r: any) => { const ex = uniqueResults.get(r.activityId); if (!ex || (r.score || 0) > (ex.score || 0)) uniqueResults.set(r.activityId, r); });
                const dedupedResults = Array.from(uniqueResults.values());
                const avgScore = dedupedResults.length > 0 ? dedupedResults.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / dedupedResults.length : 0;
                const scName = classroom.subclasses.find((sc: any) => sc.id === m.subclassId)?.name;
                const isExpanded = expandedMember === m.id;
                const completionPct = allLessonsForTracking.length > 0 ? Math.round((completedCount / allLessonsForTracking.length) * 100) : 0;

                return (
                  <div key={m.id} className={"bg-white rounded-2xl border transition-all " + (isExpanded ? "border-brand-300 shadow-md" : "border-slate-200 hover:border-brand-200 hover:shadow-sm")}>
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedMember(isExpanded ? null : m.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-base font-bold shrink-0">
                          {m.user.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-heading font-bold text-slate-900 truncate">{m.user.name || "—"}</p>
                            {scName && <span className="text-[10px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full shrink-0">{scName}</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{m.user.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: completionPct + "%" }}></div>
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 w-8 text-right">{completedCount}/{allLessonsForTracking.length}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Score moyen: <b className={avgScore >= 80 ? "text-green-600" : avgScore >= 50 ? "text-amber-600" : "text-red-600"}>{Math.round(avgScore)}%</b></p>
                          </div>
                          <svg className={"w-4 h-4 text-slate-400 shrink-0 transition-transform " + (isExpanded ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Accordion */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 animate-slide-down">
                        {/* Leçons */}
                        {allLessonsForTracking.length > 0 && (() => {
                          const grouped: Record<string, any[]> = {};
                          allLessonsForTracking.forEach((l: any) => { if (!grouped[l.sectionTitle]) grouped[l.sectionTitle] = []; grouped[l.sectionTitle].push(l); });
                          return (
                            <div>
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Leçons ({completedCount}/{allLessonsForTracking.length})</h4>
                              <div className="space-y-2">
                                {Object.entries(grouped).map(([section, lessons]) => {
                                  const done = lessons.filter((l: any) => memberProgress.find((p: any) => p.lessonId === l.id && p.status === "completed")).length;
                                  return (
                                    <details key={section} className="bg-white rounded-lg border border-slate-100">
                                      <summary className="flex items-center justify-between px-3 py-2 cursor-pointer text-xs">
                                        <span className="font-bold text-slate-700 truncate flex-1">{section}</span>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: (done / lessons.length * 100) + "%" }}></div>
                                          </div>
                                          <span className="text-slate-500 font-medium w-8 text-right">{done}/{lessons.length}</span>
                                        </div>
                                      </summary>
                                      <div className="px-3 pb-2 space-y-1">
                                        {lessons.map((l: any) => {
                                          const p = memberProgress.find((p: any) => p.lessonId === l.id);
                                          const st = p ? p.status : "not_started";
                                          return (
                                            <div key={l.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded">
                                              <span className="text-[11px] text-slate-700 truncate flex-1">{l.title}</span>
                                              <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 " + (st === "completed" ? "bg-green-500 text-white" : st === "in_progress" ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500")}>
                                                {st === "completed" ? "✓ Faite" : st === "in_progress" ? "En cours" : "À faire"}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </details>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Activités */}
                        {dedupedResults.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Activités ({dedupedResults.length})</h4>
                            <div className="bg-white rounded-lg border border-slate-100 p-2 space-y-1">
                              {dedupedResults.map((r: any) => (
                                <div key={r.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span>{(activityTypeLabels[r.activity.type] || { emoji: "?" }).emoji}</span>
                                    <span className="text-[11px] text-slate-700 truncate">{r.activity.title}</span>
                                  </div>
                                  <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 " + ((r.score || 0) >= 80 ? "bg-green-500 text-white" : (r.score || 0) >= 50 ? "bg-amber-400 text-white" : "bg-red-400 text-white")}>
                                    {Math.round(r.score || 0)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* COURS TAB */}
      {tab === "cours" && (
        <div className="space-y-6">
          {/* Liste */}
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">📚 Cours assignés ({classroom.courses.length})</h2>
            {classroom.courses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <span className="text-4xl">📚</span>
                <p className="text-slate-500 mt-3">Aucun cours assigné à cette classe.</p>
                <p className="text-xs text-slate-400 mt-1">Utilisez le formulaire ci-dessous pour en ajouter.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {classroom.courses.map((cc: any) => (
                  <div key={cc.id} data-classroom-course-card className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Link href={"/cours/" + cc.course.slug} className="font-heading font-bold text-slate-900 hover:text-brand-700 text-sm leading-tight flex-1 line-clamp-2">
                        {cc.course.title}
                      </Link>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 shrink-0">{cc.course.level}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Link href={"/admin/cours/" + cc.course.id} className="flex-1 text-xs font-semibold px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors text-center">
                        ✏️ Gérer
                      </Link>
                      <UnassignCourseBtn classroomId={classroom.id} courseId={cc.course.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigner */}
          <div className="bg-white rounded-2xl border border-dashed border-brand-300 p-5">
            <h3 className="font-heading font-bold text-slate-800 mb-3">+ Assigner un cours</h3>
            <AssignCourseForm classroomId={classroom.id} courses={availableCourses} />
            <Link href="/admin/cours/creer" className="inline-block mt-3 text-xs text-brand-600 font-semibold hover:text-brand-800">
              Ou créer un nouveau cours →
            </Link>
          </div>
        </div>
      )}

      {/* ACTIVITES TAB - Vague 2 */}
      {tab === "activites" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">Activités assignées ({classroom.activities.length})</h2>
            {classroom.activities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <span className="text-4xl">A</span>
                <p className="text-slate-500 mt-3">Aucune activité assignée à cette classe.</p>
                <p className="text-xs text-slate-400 mt-1">Utilisez le formulaire ci-dessous pour en ajouter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {classroom.activities.map((ca: any) => {
                  const t = activityTypeLabels[ca.activity.type] || { emoji: "?", label: ca.activity.type };
                  const activityResults = studentResults.filter((r: any) => r.activity.id === ca.activity.id);
                  const uniqueStudents = new Set(activityResults.map((r: any) => r.user.id)).size;
                  const totalAttempts = activityResults.length;
                  const bestPerStudent = new Map();
                  activityResults.forEach((r: any) => {
                    const ex = bestPerStudent.get(r.user.id);
                    if (!ex || (r.score || 0) > ex) bestPerStudent.set(r.user.id, r.score || 0);
                  });
                  const avgScore = bestPerStudent.size > 0
                    ? Math.round(Array.from(bestPerStudent.values()).reduce((a: number, b: number) => a + b, 0) / bestPerStudent.size)
                    : 0;
                  return (
                    <div key={ca.id} data-classroom-activity-card className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700">
                              <span>{t.emoji}</span>
                              <span>{t.label}</span>
                            </span>
                            {ca.activity.level && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{ca.activity.level}</span>
                            )}
                          </div>
                          <Link href={"/activites/" + ca.activity.id} className="font-heading font-bold text-slate-900 hover:text-brand-700 text-base leading-tight block">
                            {ca.activity.title}
                          </Link>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-center">
                            <p className="font-heading font-bold text-lg text-slate-900">{uniqueStudents}<span className="text-xs text-slate-400">/{classroom.members.length}</span></p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Élèves</p>
                          </div>
                          <div className="text-center">
                            <p className="font-heading font-bold text-lg text-slate-900">{totalAttempts}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Tentatives</p>
                          </div>
                          <div className="text-center">
                            <p className={"font-heading font-bold text-lg " + (avgScore >= 80 ? "text-green-600" : avgScore >= 50 ? "text-amber-600" : avgScore > 0 ? "text-red-600" : "text-slate-400")}>{avgScore > 0 ? avgScore + "%" : "-"}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Score moyen</p>
                          </div>
                          <UnassignActivityBtn classroomId={classroom.id} activityId={ca.activity.id} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-dashed border-brand-300 p-5">
            <h3 className="font-heading font-bold text-slate-800 mb-3">+ Assigner une activité</h3>
            <AssignActivityForm classroomId={classroom.id} activities={availableActivities} />
            <Link href="/admin/activites/creer" className="inline-block mt-3 text-xs text-brand-600 font-semibold hover:text-brand-800">
              Ou créer une nouvelle activité
            </Link>
          </div>
        </div>
      )}

      {/* ELEVES TAB - Vague 2 */}
      {tab === "eleves" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-bold text-slate-900">Élèves ({classroom.members.length})</h2>
              <p className="text-xs text-slate-400 mt-0.5">Gérez les inscriptions et les sous-classes</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSubclasses(!showSubclasses)}
                className="text-xs font-semibold px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                {showSubclasses ? "Masquer" : "Gérer les sous-classes"}
              </button>
              <div className="bg-slate-100 rounded-lg px-3 py-2">
                <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Code</p>
                <p className="font-mono font-bold text-sm tracking-widest text-slate-700">{classroom.code}</p>
              </div>
            </div>
          </div>

          {showSubclasses && (
            <div className="bg-white rounded-2xl border border-brand-200 p-5 animate-slide-down">
              <h3 className="font-heading font-bold text-slate-800 mb-3">Gestion des sous-classes</h3>
              <SubclassManager classroomId={classroom.id} members={classroom.members} subclasses={classroom.subclasses} />
            </div>
          )}

          {classroom.members.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <span className="text-4xl">EE</span>
              <p className="text-slate-500 mt-3">Aucun élève dans cette classe.</p>
              <p className="text-xs text-slate-400 mt-1">Partagez le code <b className="font-mono">{classroom.code}</b> à vos élèves.</p>
            </div>
          ) : (
            <>
              {classroom.subclasses.length > 0 && (
                <>
                  {classroom.subclasses.map((sc: any) => {
                    const scMembers = classroom.members.filter((m: any) => m.subclassId === sc.id);
                    if (scMembers.length === 0) return null;
                    return (
                      <div key={sc.id}>
                        <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-2">{sc.name} ({scMembers.length})</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                          {scMembers.map((m: any) => (
                            <div key={m.id} data-classroom-member-card className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{m.user.name?.charAt(0).toUpperCase() || "?"}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-800 text-sm truncate">{m.user.name || "-"}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{m.user.email}</p>
                                </div>
                                <RemoveMemberBtn classroomId={classroom.id} userId={m.userId} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {(() => {
                const unassigned = classroom.members.filter((m: any) => !classroom.subclasses.some((sc: any) => sc.id === m.subclassId));
                if (unassigned.length === 0) return null;
                return (
                  <div>
                    {classroom.subclasses.length > 0 && (
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Non assignés ({unassigned.length})</h3>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {unassigned.map((m: any) => (
                        <div key={m.id} data-classroom-member-card className="bg-white rounded-xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-sm font-bold shrink-0">{m.user.name?.charAt(0).toUpperCase() || "?"}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{m.user.name || "-"}</p>
                              <p className="text-[10px] text-slate-400 truncate">{m.user.email}</p>
                            </div>
                            <RemoveMemberBtn classroomId={classroom.id} userId={m.userId} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* RESSOURCES TAB - Vague 3 */}
      {tab === "ressources" && (
        <div className="space-y-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">Publications ({classroom.posts.length})</h2>
            {classroom.posts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <span className="text-4xl">P</span>
                <p className="text-slate-500 mt-3">Aucune publication pour cette classe.</p>
                <p className="text-xs text-slate-400 mt-1">Utilisez le formulaire ci-dessous pour publier votre première ressource.</p>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                {classroom.posts.map((post: any) => (
                  <div key={post.id} data-classroom-post-card className="bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-sm transition-all overflow-hidden flex flex-col">
                    <div className="flex items-start justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-bold text-slate-900 text-sm truncate">{post.title || "Publication"}</p>
                        <p className="text-[11px] text-slate-500 truncate">Par <b>{post.author.name}</b> - {new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <DeletePostBtn classroomId={classroom.id} postId={post.id} />
                    </div>
                    <div className="p-5 flex-1 space-y-3">
                      {post.content && <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.content}</p>}
                      {getYouTubeEmbedUrl(post.videoUrl) && (
                        <div className="rounded-lg overflow-hidden bg-black">
                          <iframe src={getYouTubeEmbedUrl(post.videoUrl) || ""} className="w-full aspect-video" allowFullScreen />
                        </div>
                      )}
                      {post.fileUrl && (
                        <a href={post.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition-colors">
                          <span>F</span>
                          <span className="truncate">{post.fileName || "Télécharger le fichier"}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-dashed border-brand-300 p-5">
            <h3 className="font-heading font-bold text-slate-800 mb-3">+ Nouvelle publication</h3>
            <AddPostForm classroomId={classroom.id} />
          </div>
        </div>
      )}
    </div>
  );
}