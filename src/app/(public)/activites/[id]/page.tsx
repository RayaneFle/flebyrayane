import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { activityTypeLabels, levelColors } from "@/lib/utils";
import ActivityPlayer from "@/components/activities/ActivityPlayer";
import Link from "next/link";

export default async function ActivityPlayPage({ params }: { params: { id: string } }) {
  const a = await prisma.activity.findUnique({ where: { id: params.id }, include: { createdBy: { select: { name: true } }, _count: { select: { results: true } } } });
  if (!a) notFound();
  const t = activityTypeLabels[a.type] || { label: a.type, emoji: "📝" };
  const config = typeof a.config === "string" ? JSON.parse(a.config) : a.config;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-brand-400 mb-6">
        <Link href="/activites" className="hover:text-brand-600">Activités</Link><span>/</span><span className="text-brand-600 font-medium truncate">{a.title}</span>
      </div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{t.emoji}</span>
          <span className="text-sm font-medium text-brand-400 bg-brand-50 px-3 py-1 rounded-lg">{t.label}</span>
          {a.level && <span className={`px-3 py-1 rounded-lg text-xs font-bold ${levelColors[a.level]}`}>{a.level}</span>}
        </div>
        <h1 className="font-heading text-3xl font-bold text-brand-900">{a.title}</h1>
        {a.description && <p className="text-brand-400 mt-2">{a.description}</p>}
      </div>
      <ActivityPlayer activityId={a.id} type={a.type} config={config} />
    </div>
  );
}
