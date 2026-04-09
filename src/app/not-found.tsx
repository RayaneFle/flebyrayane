import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50">
      <div className="text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-3xl mx-auto mb-6">?</div>
        <h1 className="font-heading text-4xl font-bold text-slate-900 mb-2">Page introuvable</h1>
        <p className="text-slate-400 mb-8">Cette page n'existe pas ou a ete deplacee.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/" className="px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">Retour a l'accueil</Link>
          <Link href="/cours" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">Voir les cours</Link>
        </div>
      </div>
    </div>
  );
}