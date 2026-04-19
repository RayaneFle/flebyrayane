import Link from "next/link";
export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-white to-brand-50 border-t border-brand-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-sm">R</div>
              <span className="font-heading font-bold text-lg text-brand-800">FLE<span className="text-accent-500">by</span>Rayane</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">Plateforme interactive pour apprendre le français. Cours, exercices et suivi de progression.</p>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-brand-800 mb-3">Navigation</h3>
            <nav className="flex flex-col gap-2 text-sm text-slate-400">
              <Link href="/" className="hover:text-brand-600 transition-colors">Accueil</Link>
              <Link href="/cours" className="hover:text-brand-600 transition-colors">Cours</Link>
              <Link href="/activites" className="hover:text-brand-600 transition-colors">Activites</Link>
            </nav>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-brand-800 mb-3">Compte</h3>
            <nav className="flex flex-col gap-2 text-sm text-slate-400">
              <Link href="/login" className="hover:text-brand-600 transition-colors">Connexion</Link>
              <Link href="/register" className="hover:text-brand-600 transition-colors">Inscription</Link>
              <Link href="/dashboard" className="hover:text-brand-600 transition-colors">Mon espace</Link>
            </nav>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-brand-100">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <Link href="/mentions-legales" className="hover:text-brand-600 transition-colors">Mentions legales</Link>
            <span className="text-slate-300">&middot;</span>
            <Link href="/confidentialite" className="hover:text-brand-600 transition-colors">Confidentialite</Link>
            <span className="text-slate-300">&middot;</span>
            <Link href="/cgu" className="hover:text-brand-600 transition-colors">CGU</Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-brand-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-slate-300">FLEbyRayane</p>
          <p className="text-xs text-slate-300">Fait avec amour pour le FLE</p>
        </div>
      </div>
    </footer>
  );
}