"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminFAB from "@/components/AdminFAB";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: "📊" },
  { href: "/admin/cours", label: "Mes cours", icon: "📖" },
  { href: "/admin/activites", label: "Mes activités", icon: "🎮" },
  { href: "/admin/classes", label: "Mes classes", icon: "🏫" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-56 flex-col border-r border-slate-100 bg-white shrink-0">
        <div className="p-4 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5 mb-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-sm">R</div>
            <span className="font-heading font-bold text-sm text-brand-800">FLE<span className="text-accent-500">by</span>Rayane</span>
          </Link>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Administration</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(n => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " +
                  (active ? "bg-brand-50 text-brand-700 font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")}>
                <span>{n.icon}</span>{n.label}
              </Link>
            );
          })}
          <Link href="/admin/utilisateurs"
              className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " +
                (pathname?.startsWith("/admin/utilisateurs") ? "bg-brand-50 text-brand-700 font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")}>
              <span>👥</span>Utilisateurs
            </Link>
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex justify-around py-2 px-1 safe-bottom">
        {NAV.map(n => {
          const active = n.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              className={"flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium " +
                (active ? "text-brand-700" : "text-slate-400")}>
              <span className="text-lg">{n.icon}</span>{n.label.replace("Mes ", "")}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 pb-20 lg:pb-8 overflow-x-hidden">
        <div className="lg:hidden flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-xs">R</div>
            <span className="font-heading font-bold text-sm text-brand-800">FLE<span className="text-accent-500">by</span>Rayane</span>
          </Link>
          <span className="text-[10px] font-bold text-slate-300 uppercase">Admin</span>
        </div>
        {children}
      </main>
      <AdminFAB />
    </div>
  );
}