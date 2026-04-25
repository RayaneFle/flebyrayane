import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublie",
  description: "Comment recuperer votre mot de passe sur FLE by Rayane",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Mot de passe oublie ?</h1>
        <p className="text-sm text-slate-400 mt-1">Pas de panique, on va t'aider</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-2xl shrink-0">&#128274;</span>
          <p className="text-sm text-amber-900">Pour des raisons de securite, la reinitialisation du mot de passe se fait directement avec ton professeur ou l'administrateur.</p>
        </div>

        <div>
          <h2 className="font-heading font-bold text-slate-900 text-sm mb-2">&#128100; Tu es eleve ?</h2>
          <p className="text-sm text-slate-600 leading-relaxed">Contacte ton professeur de FLE. Il pourra reinitialiser ton mot de passe depuis son espace administrateur.</p>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h2 className="font-heading font-bold text-slate-900 text-sm mb-2">&#127979; Tu es professeur ?</h2>
          <p className="text-sm text-slate-600 leading-relaxed">Contacte directement l'administrateur de la plateforme par email :</p>
          <a href="mailto:bekhakhrayane@gmail.com" className="inline-block mt-2 text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors">
            bekhakhrayane@gmail.com
          </a>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700 transition-colors">
            &larr; Retour a la connexion
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">Pas encore de compte ? <Link href="/register" className="text-brand-600 font-semibold hover:text-brand-700">Creer un compte</Link></p>
    </div>
  );
}
