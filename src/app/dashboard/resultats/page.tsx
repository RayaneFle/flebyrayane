import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { activityTypeLabels, levelColors, scoreToStars } from "@/lib/utils";

export default async function ResultatsPage() {
  const session = await getServerSession(authOptions);
  const results = await prisma.activityResult.findMany({
    where: { userId: session!.user.id },
    include: { activity: { select: { title: true, type: true, level: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const avg = results.length > 0 ? results.reduce((a, r) => a + (r.score || 0), 0) / results.length : 0;
  const best = results.length > 0 ? Math.max(...results.map(r => r.score || 0)) : 0;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-8">Mes résultats</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-brand-100 p-5 text-center"><p className="text-2xl font-bold text-slate-800">{results.length}</p><p className="text-xs text-slate-400">Activités jouées</p></div>
        <div className="bg-white rounded-2xl border border-brand-100 p-5 text-center"><p className="text-2xl font-bold text-brand-600">{Math.round(avg)}%</p><p className="text-xs text-slate-400">Score moyen</p></div>
        <div className="bg-white rounded-2xl border border-brand-100 p-5 text-center"><p className="text-2xl font-bold text-green-600">{Math.round(best)}%</p><p className="text-xs text-slate-400">Meilleur score</p></div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center"><span className="text-5xl">📈</span><p className="text-slate-400 mt-4">Aucun résultat.</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-100 overflow-x-auto">
          <table className="w-full"><thead><tr className="border-b border-slate-100 bg-brand-50/50 text-xs font-semibold text-slate-400 uppercase"><th className="text-left px-5 py-3">Activité</th><th className="text-center px-5 py-3">Type</th><th className="text-center px-5 py-3">Niveau</th><th className="text-center px-5 py-3">Score</th><th className="text-center px-5 py-3">Étoiles</th><th className="text-center px-5 py-3">Tentatives</th></tr></thead>
          <tbody className="divide-y divide-slate-50">{results.map(r => {
            const t = activityTypeLabels[r.activity.type] || { emoji: "📝", label: r.activity.type };
            const stars = scoreToStars(r.score || 0);
            return (
              <tr key={r.id} className="hover:bg-brand-50/30">
                <td className="px-5 py-4 font-medium text-slate-800">{r.activity.title}</td>
                <td className="px-5 py-4 text-center text-sm">{t.emoji} {t.label}</td>
                <td className="px-5 py-4 text-center">{r.activity.level ? <span className={`px-2 py-0.5 rounded text-xs font-bold ${levelColors[r.activity.level]}`}>{r.activity.level}</span> : "—"}</td>
                <td className="px-5 py-4 text-center"><span className={`font-bold ${(r.score||0) >= 60 ? "text-green-600" : (r.score||0) >= 30 ? "text-amber-500" : "text-red-500"}`}>{Math.round(r.score||0)}%</span></td>
                <td className="px-5 py-4 text-center">{[1,2,3].map(i => <span key={i} className={`text-lg ${i <= stars ? "star-earned" : "star-empty"}`}>★</span>)}</td>
                <td className="px-5 py-4 text-center text-sm text-slate-500">{r.attempts}</td>
              </tr>
            );
          })}</tbody></table>
        </div>
      )}
    </div>
  );
}
