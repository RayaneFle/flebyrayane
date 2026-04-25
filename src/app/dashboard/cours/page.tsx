import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { levelColors, activityTypeLabels, getYouTubeEmbedUrl } from "@/lib/utils";

export default async function DashboardCoursPage() {
  const session = await getServerSession(authOptions);
  const uid = session!.user.id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: uid },
    include: { course: true },
  });

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: uid },
    include: {
      classroom: {
        include: {
          courses: { include: { course: true } },
          activities: { include: { activity: { select: { id: true, title: true, type: true, level: true } } } },
          posts: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  const enrolledIds = new Set(enrollments.map((e: any) => e.courseId));
  const classCourses = memberships.flatMap((m: any) => m.classroom.courses.map((cc: any) => cc.course)).filter((c: any) => !enrolledIds.has(c.id));
  const classActivities = memberships.flatMap((m: any) => m.classroom.activities.map((ca: any) => ({ ...ca.activity, classroomName: m.classroom.name })));
  const allPosts = memberships.flatMap((m: any) => m.classroom.posts.map((p: any) => ({ ...p, classroomName: m.classroom.name })));
  const empty = enrollments.length === 0 && classCourses.length === 0 && classActivities.length === 0 && allPosts.length === 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-8">Mes cours</h1>

      {empty ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center">
          <span className="text-5xl">\ud83d\udc4b</span>
          <h2 className="font-heading text-xl font-bold text-slate-800 mt-4">Bienvenue {session?.user?.name || ""} !</h2>
          <p className="text-slate-500 mt-3 max-w-md mx-auto">Pour commencer, rejoins une classe avec le code donné par ton enseignant, ou explore les cours publics disponibles.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link href="/dashboard/rejoindre" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">
              <span>\ud83c\udf93</span>
              <span>Rejoindre une classe</span>
            </Link>
            <Link href="/cours" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-50 text-brand-700 font-semibold rounded-xl hover:bg-brand-100 transition-colors">
              <span>\ud83d\udd0d</span>
              <span>Explorer les cours</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.length > 0 && (
            <details open className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
              <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">\ud83d\udcd6 Mes cours inscrits ({enrollments.length})</summary>
              <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.map((e: any) => (
                  <Link key={e.id} href={`/cours/${e.course.slug}`} className="bg-brand-50/50 rounded-xl p-4 hover:bg-brand-50 transition-colors group">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${levelColors[e.course.level]}`}>{e.course.level}</span>
                    <h3 className="font-heading font-bold text-slate-900 group-hover:text-brand-600 mt-2">{e.course.title}</h3>
                  </Link>
                ))}
              </div>
            </details>
          )}

          {classCourses.length > 0 && (
            <details open className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
              <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">\ud83c\udfeb Cours de mes classes ({classCourses.length})</summary>
              <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classCourses.map((c: any) => (
                  <Link key={c.id} href={`/cours/${c.slug}`} className="bg-brand-50/50 rounded-xl p-4 hover:bg-brand-50 transition-colors group">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${levelColors[c.level]}`}>{c.level}</span>
                    <h3 className="font-heading font-bold text-slate-900 group-hover:text-brand-600 mt-2">{c.title}</h3>
                  </Link>
                ))}
              </div>
            </details>
          )}

          {classActivities.length > 0 && (
            <details open className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
              <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">\ud83c\udfae Activités de mes classes ({classActivities.length})</summary>
              <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classActivities.map((a: any) => {
                  const t = activityTypeLabels[a.type] || { emoji: "?", label: a.type };
                  return (
                    <Link key={a.id} href={`/activites/${a.id}`} className="bg-brand-50/50 rounded-xl p-4 hover:bg-brand-50 transition-colors group">
                      <div className="flex items-center gap-2">
                        <span>{t.emoji}</span>
                        <span className="text-xs text-slate-400">{a.classroomName}</span>
                      </div>
                      <h3 className="font-heading font-bold text-slate-900 group-hover:text-brand-600 mt-1">{a.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{t.label} {a.level || ""}</p>
                    </Link>
                  );
                })}
              </div>
            </details>
          )}

          {allPosts.length > 0 && (
            <details className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
              <summary className="px-6 py-4 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 cursor-pointer font-heading font-bold text-slate-800 select-none">\ud83d\udccc Ressources ({allPosts.length})</summary>
              <div className="p-6 space-y-3">
                {allPosts.map((p: any) => (
                  <div key={p.id} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{p.type==="video"?"\ud83c\udfac":p.type==="pdf"?"\ud83d\udcc4":"\ud83d\udcdd"}</span>
                      <span className="font-medium text-slate-800 text-sm">{p.title||"Publication"}</span>
                      <span className="text-xs text-slate-400 ml-auto">{p.classroomName}</span>
                    </div>
                    {p.content && <p className="text-sm text-slate-600 mb-3">{p.content}</p>}
                    {getYouTubeEmbedUrl(p.videoUrl) && <div className="rounded-xl overflow-hidden bg-black mb-3"><iframe src={getYouTubeEmbedUrl(p.videoUrl) || ""} className="w-full aspect-video" allowFullScreen /></div>}
                    {p.fileUrl && <a href={p.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-600 bg-brand-50 px-4 py-2 rounded-lg">\ud83d\udcc4 {p.fileName||"Fichier"}</a>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}