export const metadata = {
  title: "Mentions légales - FLE by Rayane",
  description: "Mentions légales du site FLE by Rayane.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl font-bold text-brand-900 mb-8">Mentions légales</h1>

      <section className="space-y-6 text-slate-700 leading-relaxed">
        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Éditeur du site</h2>
          <p>Le site FLE by Rayane est édité par Rayane, à titre personnel et non lucratif.</p>
          <p>Localisation : France</p>
          <p>Contact : bekhakhrayane@gmail.com</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Directeur de la publication</h2>
          <p>Rayane</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Hébergement</h2>
          <p>Le site est hébergé par :</p>
          <p>Vercel Inc.</p>
          <p>340 S Lemon Ave #4133</p>
          <p>Walnut, CA 91789, USA</p>
          <p>Site : <a href="https://vercel.com" className="text-brand-600 underline" target="_blank" rel="noopener noreferrer">vercel.com</a></p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Nature de l&apos;activité</h2>
          <p>FLE by Rayane est un site éducatif personnel, proposant gratuitement des ressources d&apos;apprentissage du français langue étrangère. Le site n&apos;a aucune activité commerciale.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Propriété intellectuelle</h2>
          <p>L&apos;ensemble du contenu présent sur le site (textes, exercices, images) est la propriété de l&apos;éditeur ou est utilisé avec autorisation. Toute reproduction est interdite sans autorisation préalable.</p>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-slate-900 mb-2">Contact</h2>
          <p>Pour toute question relative aux mentions légales, à la protection des données, ou au contenu du site : <a href="mailto:bekhakhrayane@gmail.com" className="text-brand-600 underline">bekhakhrayane@gmail.com</a></p>
        </div>
      </section>
    </div>
  );
}
