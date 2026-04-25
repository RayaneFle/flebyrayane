import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { activityTypeLabels, levelColors } from "@/lib/utils";
import ActivityPlayer from "@/components/activities/ActivityPlayer";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = await prisma.activity.findUnique({ where: { id: params.id }, select: { title: true, description: true, type: true, level: true, isPublic: true } });
  if (!a || !a.isPublic) return { title: "Activité introuvable" };
  const t = activityTypeLabels[a.type] || { label: a.type, emoji: "" };
  return {
    title: a.title + " — " + t.label + (a.level ? " (" + a.level + ")" : ""),
    description: a.description || "Activité interactive de FLE : " + a.title,
    openGraph: {
      title: a.title + " | FLE by Rayane",
      description: a.description || "Activité interactive de FLE",
    },
  };
}

export default async function ActivityPlayPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const isTeacher = session?.user?.role === "admin" || session?.user?.role === "teacher";

  const a = await prisma.activity.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { results: true } },
    },
  });
  if (!a) notFound();
  if (!a.isPublic && !isTeacher && a.createdBy.id !== session?.user?.id) notFound();

  // Get user's history on this activity
  let userBestScore: number | null = null;
  let userLastScore: number | null = null;
  let userPlayCount = 0;
  if (session?.user) {
    const userResults = await prisma.activityResult.findMany({
      where: { userId: session.user.id, activityId: a.id },
      orderBy: { updatedAt: "desc" },
      select: { score: true, completed: true, updatedAt: true },
    });
    if (userResults.length > 0) {
      userPlayCount = userResults.length;
      userLastScore = userResults[0].score || 0;
      userBestScore = Math.max(...userResults.map(r => r.score || 0));
    }
  }

  const t = activityTypeLabels[a.type] || { label: a.type, emoji: "" };
  const config = typeof a.config === "string" ? JSON.parse(a.config) : a.config;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/activites" className="hover:text-brand-600 transition-colors">Activités</Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium truncate">{a.title}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700">
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </span>
          {a.level && (
            <span className={"text-[10px] font-bold px-2 py-0.5 rounded-full " + (levelColors[a.level] || "bg-slate-100 text-slate-600")}>{a.level}</span>
          )}
          {!a.isPublic && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Privée</span>
          )}
        </div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{a.title}</h1>
        {a.description && <p className="text-slate-500 mt-2 text-sm">{a.description}</p>}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>Par <b className="text-slate-700">{a.createdBy.name}</b></span>
          {a._count.results > 0 && (
            <>
              <span className="text-slate-300">.</span>
              <span><b className="text-slate-700">{a._count.results}</b> partie{a._count.results > 1 ? "s" : ""} jouée{a._count.results > 1 ? "s" : ""}</span>
            </>
          )}
        </div>
      </div>

      {/* User history (only if user has played) */}
      {session?.user && userPlayCount > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tes parties</p>
            <p className="font-heading text-xl font-bold text-slate-900 mt-1">{userPlayCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dernier score</p>
            <p className={"font-heading text-xl font-bold mt-1 " + ((userLastScore || 0) >= 80 ? "text-green-600" : (userLastScore || 0) >= 50 ? "text-amber-600" : "text-red-600")}>{userLastScore}%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Meilleur</p>
            <p className={"font-heading text-xl font-bold mt-1 " + ((userBestScore || 0) >= 80 ? "text-green-600" : (userBestScore || 0) >= 50 ? "text-amber-600" : "text-red-600")}>{userBestScore}%</p>
          </div>
        </div>
      )}

      {/* Game zone */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <ActivityPlayer activityId={a.id} type={a.type} config={config} />
      </div>

      {/* Footer CTA */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/activites" className="text-sm font-semibold text-slate-600 hover:text-brand-700 transition-colors">
          &larr; Retour aux activités
        </Link>
        {!session?.user && (
          <Link href="/register" className="text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors">
            Inscris-toi pour suivre tes scores &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
