import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { activityTypeLabels, levelColors } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 60;

export default async function ActivitesPage({ searchParams }: { searchParams: { type?: string; level?: string } }) {
  const sp = await (searchParams as any);
  const type = sp?.type; const level = sp?.level;
  const session = await getServerSession(authOptions);
  const isTeacher = session?.user?.role === "admin" || session?.user?.role === "teacher";

  const activities = await prisma.activity.findMany({
    where: { isPublic: true, ...(type ? { type } : {}), ...(level ? { level } : {}) },
    include: { createdBy: { select: { name: true } }, _count: { select: { results: true } } },
    orderBy: { createdAt: "desc" },
  });

  const types = Object.entries(activityTypeLabels);
  const levels = ["A1","A2","B1","B2","C1","C2"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-heading text-4xl font-bold text-brand-900">Activités interactives</h1>
          <p className="text-brand-400 mt-2 text-lg">Entraînez-vous avec nos jeux</p>
        </div>
        {isTeacher && <Link href="/admin/activites/creer" className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all text-sm">+ Créer une activité</Link>}
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-brand-500 mb-2">Type :</p>
        <div className="flex flex-wrap gap-2">
          <Pill href={`/activites${level ? `?level=${level}` : ""}`} active={!type}>Toutes</Pill>
          {types.map(([k, v]) => <Pill key={k} href={`/activites?type=${k}${level ? `&level=${level}` : ""}`} active={type === k}>{v.emoji} {v.label}</Pill>)}
        </div>
      </div>
      <div className="mb-8">
        <p className="text-sm font-medium text-brand-500 mb-2">Niveau :</p>
        <div className="flex flex-wrap gap-2">
          <Pill href={`/activites${type ? `?type=${type}` : ""}`} active={!level}>Tous</Pill>
          {levels.map(l => <Pill key={l} href={`/activites?${type ? `type=${type}&` : ""}level=${l}`} active={level === l}>{l}</Pill>)}
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-brand-100"><span className="text-5xl">🎮</span><p className="text-brand-400 mt-4 text-lg">Aucune activité.</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {activities.map(a => {
            const t = activityTypeLabels[a.type] || { label: a.type, emoji: "📝" };
            return (
              <Link key={a.id} href={`/activites/${a.id}`} className="group bg-white rounded-2xl p-5 border border-brand-100 card-hover animate-fade-in-up">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="text-xs font-medium text-brand-400 bg-brand-50 px-2.5 py-0.5 rounded-md">{t.label}</span>
                  {a.level && <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${levelColors[a.level]}`}>{a.level}</span>}
                </div>
                <h3 className="font-heading font-bold text-lg text-brand-900 group-hover:text-brand-600 transition-colors">{a.title}</h3>
                {a.description && <p className="text-sm text-brand-400 mt-2 line-clamp-2">{a.description}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${active ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-sm" : "bg-white text-brand-500 border border-brand-200 hover:border-brand-300"}`}>{children}</Link>;
}
