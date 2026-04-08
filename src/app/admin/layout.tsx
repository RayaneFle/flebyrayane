import AdminFAB from "@/components/AdminFAB";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "admin" && session.user.role !== "teacher")) redirect("/");
  return (
    <div className="min-h-screen bg-surface-50"><Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-56 shrink-0"><div className="bg-white rounded-2xl border border-brand-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Administration</p>
            <nav className="space-y-0.5">
              <SL href="/admin" e="📊">Vue d&apos;ensemble</SL>
              <SL href="/admin/activites" e="🎮">Mes activités</SL>
              <SL href="/admin/cours" e="📖">Mes cours</SL>
              <SL href="/admin/classes" e="🏫">Mes classes</SL>
              {session.user.role === "admin" && <SL href="/admin/utilisateurs" e="👥">Utilisateurs</SL>}
            </nav>
          </div></aside>
          <main className="flex-1 min-w-0">{children}<AdminFAB /></main>
        </div>
      </div>
    </div>
  );
}
function SL({ href, e, children }: { href: string; e: string; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-brand-50 hover:text-brand-700 transition-colors"><span>{e}</span>{children}<AdminFAB /></Link>;
}
