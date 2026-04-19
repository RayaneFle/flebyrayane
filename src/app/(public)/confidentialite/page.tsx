export const metadata = {
  title: "Politique de confidentialité - FLE by Rayane",
  description: "Comment vos données sont traitées sur FLE by Rayane.",
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl font-bold text-brand-900 mb-8">Politique de confidentialité</h1>

      <section className="space-y-6 text-slate-700 leading-relaxed">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Responsable du traitement</h2>
          <p>Rayane, éditeur du site FLE by Rayane (France).</p>
          <p>Contact : <a href="mailto:bekhakhrayane@gmail.com" className="text-brand-600 underline">bekhakhrayane@gmail.com</a></p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Données collectées</h2>
          <p>Lorsque vous créez un compte, nous collectons :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Votre nom (choisi par vous)</li>
            <li>Votre adresse email</li>
            <li>Un mot de passe (stocké de façon chiffrée, jamais en clair)</li>
          </ul>
          <p className="mt-3">Lors de votre utilisation du site, nous enregistrons également :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Vos progrès dans les cours et activités</li>
            <li>Vos scores aux exercices</li>
            <li>Votre appartenance à des classes</li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Finalité du traitement</h2>
          <p>Ces données sont utilisées uniquement pour :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Vous permettre d&apos;utiliser le service (connexion, suivi des cours)</li>
            <li>Permettre à votre enseignant de suivre votre progression</li>
            <li>Assurer le bon fonctionnement du site</li>
          </ul>
          <p className="mt-3">Aucune donnée n&apos;est vendue, ni communiquée à des tiers à des fins commerciales.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Sous-traitants</h2>
          <p>Les données sont stockées via :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Supabase (hébergement de base de données)</li>
            <li>Vercel (hébergement du site)</li>
          </ul>
          <p className="mt-3">Ces prestataires peuvent stocker des données hors de l&apos;Union européenne. Ils sont soumis aux clauses contractuelles types de la Commission européenne pour garantir un niveau de protection adéquat.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Durée de conservation</h2>
          <p>Vos données sont conservées tant que votre compte est actif. Elles sont supprimées lors de la suppression de votre compte.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Vos droits (RGPD)</h2>
          <p>Conformément au règlement européen sur la protection des données (RGPD), vous disposez des droits suivants :</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Droit d&apos;accès</strong> : connaître les données que nous détenons sur vous</li>
            <li><strong>Droit de rectification</strong> : modifier vos données (via votre profil)</li>
            <li><strong>Droit à l&apos;effacement</strong> : supprimer votre compte (via votre profil)</li>
            <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format lisible</li>
            <li><strong>Droit d&apos;opposition</strong> : vous opposer au traitement</li>
          </ul>
          <p className="mt-3">Pour exercer ces droits, contactez-nous : <a href="mailto:bekhakhrayane@gmail.com" className="text-brand-600 underline">bekhakhrayane@gmail.com</a></p>
          <p className="mt-2">Vous disposez également du droit de saisir la CNIL (<a href="https://www.cnil.fr" className="text-brand-600 underline" target="_blank" rel="noopener noreferrer">cnil.fr</a>) en cas de manquement.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Cookies</h2>
          <p>Le site utilise uniquement des cookies strictement nécessaires au fonctionnement (cookie de session pour garder votre connexion active). Aucun cookie publicitaire ou de suivi n&apos;est utilisé.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Sécurité</h2>
          <p>Les mots de passe sont stockés de façon chiffrée (bcrypt). Les communications avec le site sont chiffrées (HTTPS). Des mesures techniques sont en place pour protéger vos données contre les accès non autorisés.</p>
        </div>
      </section>
    </div>
  );
}
