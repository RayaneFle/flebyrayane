import Link from "next/link";
import { activityTypeLabels } from "@/lib/utils";

const CATS: Record<string, string[]> = {
  "Quiz": ["QCM", "TRUE_FALSE", "FILL_BLANKS"],
  "Vocabulaire": ["MATCHING", "MEMORY", "HANGMAN"],
  "Organisation": ["DRAG_DROP", "SORTING", "CATEGORIZE", "WORD_ORDER"],
};
const DESC: Record<string, string> = { QCM: "Choix multiples avec feedback", TRUE_FALSE: "Vrai ou faux", FILL_BLANKS: "Texte avec trous", MATCHING: "Associer des paires", MEMORY: "Retrouver les paires", HANGMAN: "Deviner lettre par lettre", DRAG_DROP: "Glisser vers la zone", SORTING: "Remettre en ordre", CATEGORIZE: "Trier dans des catégories", WORD_ORDER: "Remettre les mots dans l'ordre" };

export default function CreerActivitePage() {
  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <a href="/admin/activites" className="hover:text-brand-600 transition-colors">Mes activités</a>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">Nouvelle activité</span>
      </div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Créer une activité</h1>
        <p className="text-sm text-slate-500 mt-1">Choisis le type de jeu que tu veux créer pour tes élèves.</p>
      </div>
      {Object.entries(CATS).map(([cat, types]) => (
        <div key={cat} className="mb-8">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{cat}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {types.map(type => { const info = activityTypeLabels[type]; if (!info) return null;
              return (
                <Link key={type} href={"/admin/activites/creer/" + type} className="group bg-white rounded-2xl border border-slate-200 hover:border-brand-300 hover:shadow-md transition-all p-4 flex items-start gap-3">
                  <span className="text-3xl shrink-0">{info.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-slate-900 group-hover:text-brand-700 transition-colors">{info.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{DESC[type]}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
