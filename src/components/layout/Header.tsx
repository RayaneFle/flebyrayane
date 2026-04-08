"use client";

import { useState } from "react";
import Link from "next/link";
import { LangSwitcher } from "@/lib/i18n";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isAdmin = session?.user?.role === "admin";
  const isTeacher = session?.user?.role === "teacher" || isAdmin;

  return (
    <header className="sticky top-0 z-50 glass border-b border-brand-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-sm shadow-glow group-hover:scale-105 transition-transform">R</div>
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg leading-none text-brand-800 tracking-tight">FLE<span className="text-accent-500">by</span>Rayane</span>
              <span className="text-[10px] text-brand-300 font-medium tracking-widest uppercase">Apprendre · Jouer · Progresser</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/">Accueil</NavLink>
            <NavLink href="/cours">Cours</NavLink>
            <NavLink href="/activites">Activités</NavLink>
            {isTeacher && <NavLink href="/admin">Admin</NavLink>}
          </nav>

          <div className="hidden md:flex items-center gap-3"><LangSwitcher />
            {session ? (
              <div className="relative">
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-brand-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-brand-700 max-w-[120px] truncate">{session.user.name || "Compte"}</span>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-brand-100 py-2 z-20 animate-slide-down">
                      <div className="px-4 py-3 border-b border-brand-50">
                        <p className="text-sm font-semibold text-brand-900">{session.user.name}</p>
                        <p className="text-xs text-brand-400">{session.user.email}</p>
                      </div>
                      <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50">📊 Mon espace</Link>
                      <Link href="/dashboard/resultats" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50">📈 Mes résultats</Link>
                      {isTeacher && <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50">⚙️ Administration</Link>}
                      <hr className="my-1 border-brand-50" />
                      <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">🚪 Déconnexion</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">Connexion</Link>
                <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-brand-500 to-accent-500 text-white px-5 py-2 rounded-xl hover:shadow-glow transition-all">S&apos;inscrire</Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-brand-50" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-brand-100 py-4 space-y-1 animate-slide-down">
            <MLink href="/" onClick={() => setMenuOpen(false)}>🏠 Accueil</MLink>
            <MLink href="/cours" onClick={() => setMenuOpen(false)}>📖 Cours</MLink>
            <MLink href="/activites" onClick={() => setMenuOpen(false)}>🎮 Activités</MLink>
            {isTeacher && <MLink href="/admin" onClick={() => setMenuOpen(false)}>⚙️ Admin</MLink>}
            <hr className="border-brand-100 my-2" />
            {session ? (
              <>
                <MLink href="/dashboard" onClick={() => setMenuOpen(false)}>📊 Mon espace</MLink>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left px-4 py-2.5 text-red-500 font-medium rounded-xl hover:bg-red-50">🚪 Déconnexion</button>
              </>
            ) : (
              <>
                <MLink href="/login" onClick={() => setMenuOpen(false)}>🔑 Connexion</MLink>
                <MLink href="/register" onClick={() => setMenuOpen(false)}>✨ S&apos;inscrire</MLink>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="px-4 py-2 text-sm font-medium text-brand-600 hover:text-brand-800 rounded-xl hover:bg-brand-50/80 transition-all">{children}</Link>;
}
function MLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return <Link href={href} onClick={onClick} className="block px-4 py-2.5 text-base font-medium text-brand-700 hover:bg-brand-50 rounded-xl">{children}</Link>;
}
