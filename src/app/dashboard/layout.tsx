import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Link from "next/link";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="min-h-screen bg-surface-50"><Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-56 shrink-0"><nav className="bg-white rounded-2xl border border-brand-100 p-4 space-y-0.5">
            <SL href="/dashboard" e="📊">Tableau de bord</SL>
            <SL href="/dashboard/cours" e="📖">Mes cours</SL>
            <SL href="/dashboard/resultats" e="📈">Mes résultats</SL>
            <SL href="/dashboard/rejoindre" e="🏫">Rejoindre une classe</SL>
            <SL href="/dashboard/profil" e="👤">Mon profil</SL>
          </nav></aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
function SL({ href, e, children }: { href: string; e: string; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-brand-50 hover:text-brand-700 transition-colors"><span>{e}</span>{children}</Link>;
}
