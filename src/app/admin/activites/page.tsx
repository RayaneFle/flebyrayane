import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DuplicateActivityBtn from "./DuplicateActivityBtn";
import { activityTypeLabels, levelColors } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DeleteBtn from "./DeleteBtn";

export default async function AdminActivitesPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  const where = isAdmin ? {} : { createdById: session?.user?.id || "" };
  const activities = await prisma.activity.findMany({ where, orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true, id: true } }, _count: { select: { results: true } } } });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="font-heading text-2xl font-bold text-slate-900">{isAdmin ? "Toutes les activités" : "Mes activités"}</h1><p className="text-slate-400">{activities.length} activité(s)</p></div>
        <Link href="/admin/activites/creer" className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">+ Créer</Link>
      </div>
      {activities.length === 0 ? <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center"><span className="text-5xl">🎮</span><p className="text-slate-400 mt-4">Aucune activité.</p></div> : (
        <div className="bg-white rounded-2xl border border-brand-100 overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-100 bg-brand-50/50 text-xs font-semibold text-slate-400 uppercase"><th className="text-left px-5 py-3">Activité</th><th className="text-left px-5 py-3">Type</th><th className="text-center px-5 py-3">Niveau</th><th className="text-left px-5 py-3">Auteur</th><th className="text-center px-5 py-3">Parties</th><th className="text-right px-5 py-3">Actions</th></tr></thead>
        <tbody className="divide-y divide-slate-50">{activities.map(a => { const t = activityTypeLabels[a.type] || { emoji:"📝", label:a.type }; const canDelete = isAdmin || a.createdBy.id === session?.user?.id; return (
          <tr key={a.id} className="hover:bg-brand-50/30"><td className="px-5 py-4 font-medium text-slate-800">{a.title}</td><td className="px-5 py-4 text-sm">{t.emoji} {t.label}</td><td className="px-5 py-4 text-center">{a.level ? <span className={`px-2 py-0.5 rounded text-xs font-bold ${levelColors[a.level]}`}>{a.level}</span> : "—"}</td><td className="px-5 py-4 text-sm text-slate-500">{a.createdBy.name}</td><td className="px-5 py-4 text-center text-sm">{a._count.results}</td>
          <td className="px-5 py-4 text-right"><div className="flex items-center justify-end gap-1.5 flex-wrap"><Link href={`/activites/${a.id}`} className="text-xs px-3 py-1.5 bg-brand-50 rounded-lg hover:bg-brand-100">Voir</Link><Link href={`/admin/activites/${a.id}/modifier`} className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100">Modifier</Link><DuplicateActivityBtn activityId={a.id} />{canDelete && <DeleteBtn id={a.id} />}</div></td></tr>); })}</tbody></table></div>
      )}
    </div>
  );
}
