import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { levelColors } from "@/lib/utils";
import DeleteCourseInline from "./DeleteCourseInline";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminCoursPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  const where = isAdmin ? {} : { authorId: session?.user?.id || "" };
  const courses = await prisma.course.findMany({ where, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, id: true } }, sections: { select: { id: true } }, _count: { select: { enrollments: true } } } });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="font-heading text-3xl font-bold text-slate-900">{isAdmin ? "Tous les cours" : "Mes cours"}</h1><p className="text-slate-400">{courses.length} cours</p></div>
        <Link href="/admin/cours/creer" className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">+ Créer un cours</Link>
      </div>
      {courses.length === 0 ? <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center"><span className="text-5xl">📖</span><p className="text-slate-400 mt-4">Aucun cours.</p></div> : (
        <div className="bg-white rounded-2xl border border-brand-100 overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-slate-100 bg-brand-50/50 text-xs font-semibold text-slate-400 uppercase"><th className="text-left px-5 py-3">Cours</th><th className="text-center px-5 py-3">Niveau</th><th className="text-center px-5 py-3">Code</th><th className="text-center px-5 py-3">Inscrits</th><th className="text-right px-5 py-3">Actions</th></tr></thead>
        <tbody className="divide-y divide-slate-50">{courses.map(c => (
          <tr key={c.id} className="hover:bg-brand-50/30"><td className="px-5 py-4 font-medium text-slate-800">{c.title}</td><td className="px-5 py-4 text-center"><span className={`px-2 py-0.5 rounded text-xs font-bold ${levelColors[c.level]}`}>{c.level}</span></td><td className="px-5 py-4 text-center">{c.enrollmentCode ? <span className="font-mono text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded">{c.enrollmentCode}</span> : <span className="text-xs text-slate-300">Libre</span>}</td><td className="px-5 py-4 text-center text-sm">{c._count.enrollments}</td>
          <td className="px-5 py-4 text-right space-x-2"><Link href={`/admin/cours/${c.id}`} className="text-xs px-3 py-1.5 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100">✏️ Éditer</Link><Link href={`/cours/${c.slug}`} className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100">👁 Voir</Link></td></tr>
        ))}</tbody></table></div>
      )}
    </div>
  );
}
