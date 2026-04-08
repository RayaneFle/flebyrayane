"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Mon espace", icon: "🏠" },
  { href: "/dashboard/cours", label: "Mes cours", icon: "📖" },
  { href: "/dashboard/resultats", label: "Resultats", icon: "📈" },
  { href: "/dashboard/rejoindre", label: "Rejoindre", icon: "🔑" },
  { href: "/dashboard/profil", label: "Profil", icon: "👤" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:w-52 flex-col border-r border-slate-100 bg-white shrink-0">
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mon espace</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(n => {
            const active = n.href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={"flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " +
                  (active ? "bg-brand-50 text-brand-700 font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")}>
                <span>{n.icon}</span>{n.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex justify-around py-2 px-1 safe-bottom">
        {NAV.slice(0, 4).map(n => {
          const active = n.href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              className={"flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium " +
                (active ? "text-brand-700" : "text-slate-400")}>
              <span className="text-lg">{n.icon}</span>{n.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 pb-20 lg:pb-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}