export const metadata = {
  title: "Conditions générales d'utilisation - FLE by Rayane",
  description: "Conditions d'utilisation du site FLE by Rayane.",
};

export default function CGUPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl font-bold text-brand-900 mb-8">Conditions générales d&apos;utilisation</h1>

      <section className="space-y-6 text-slate-700 leading-relaxed">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">1. Objet</h2>
          <p>Les présentes conditions régissent l&apos;utilisation du site FLE by Rayane, plateforme éducative gratuite d&apos;apprentissage du français langue étrangère.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">2. Accès au service</h2>
          <p>L&apos;accès au contenu pédagogique est libre et gratuit. Certaines fonctionnalités (suivi de progression, activités, classes) nécessitent la création d&apos;un compte.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">3. Création de compte</h2>
          <p>Lors de l&apos;inscription, l&apos;utilisateur s&apos;engage à :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Fournir des informations exactes</li>
            <li>Choisir un mot de passe suffisamment sécurisé (8 caractères minimum)</li>
            <li>Ne pas partager ses identifiants avec des tiers</li>
          </ul>
          <p className="mt-3">L&apos;éditeur se réserve le droit de suspendre tout compte en cas de manquement aux présentes conditions.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">4. Utilisation du service</h2>
          <p>L&apos;utilisateur s&apos;engage à utiliser le site dans le respect des lois en vigueur. Sont notamment interdits :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Toute tentative d&apos;accès non autorisé</li>
            <li>Toute activité pouvant perturber le service</li>
            <li>Toute publication de contenu illicite, offensant ou inapproprié</li>
            <li>L&apos;usurpation d&apos;identité</li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">5. Propriété intellectuelle</h2>
          <p>Le contenu pédagogique (cours, exercices, textes) est la propriété de l&apos;éditeur. Toute reproduction ou utilisation à des fins commerciales est interdite sans autorisation écrite.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">6. Responsabilité</h2>
          <p>Le service est fourni « en l&apos;état ». L&apos;éditeur ne garantit pas une disponibilité continue et ne saurait être tenu responsable d&apos;éventuelles interruptions. Le contenu pédagogique est fourni à titre indicatif ; l&apos;éditeur ne garantit pas de résultats d&apos;apprentissage spécifiques.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">7. Données personnelles</h2>
          <p>Le traitement des données personnelles est détaillé dans la <a href="/confidentialite" className="text-brand-600 underline">politique de confidentialité</a>.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">8. Résiliation</h2>
          <p>L&apos;utilisateur peut supprimer son compte à tout moment via son profil. Toutes ses données personnelles sont alors effacées.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">9. Modifications</h2>
          <p>Les présentes conditions peuvent être mises à jour. La version en vigueur est celle publiée sur cette page.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">10. Droit applicable</h2>
          <p>Les présentes conditions sont soumises au droit français. En cas de litige, les tribunaux français sont compétents.</p>
        </div>
      </section>
    </div>
  );
}
