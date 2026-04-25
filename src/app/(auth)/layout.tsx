import Link from "next/link";
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 via-brand-500 to-accent-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col justify-center px-12 xl:px-20">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-heading font-black text-xl">R</div>
            <span className="font-heading font-bold text-2xl text-white">FLE<span className="text-accent-200">by</span>Rayane</span>
          </Link>
          <h2 className="font-heading text-4xl font-bold text-white leading-tight mb-4">Apprenez le français<br />en vous amusant</h2>
          <p className="text-brand-100 text-lg leading-relaxed mb-8">Cours structurés, exercices ludiques et suivi de progression pour tous les niveaux.</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">10</div>
              <div><p className="text-white font-medium text-sm">Types d’exercices</p><p className="text-brand-200 text-xs">QCM, memory, pendu, appariement...</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-lg">A1</div>
              <div><p className="text-white font-medium text-sm">Tous les niveaux CECRL</p><p className="text-brand-200 text-xs">Du débutant à l’avancé</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white text-lg">%</div>
              <div><p className="text-white font-medium text-sm">Suivi de progression</p><p className="text-brand-200 text-xs">Scores, erreurs, temps passé</p></div>
            </div>
          </div>
        </div>
      </div>
      {/* Right panel - form */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-white">
        <div className="p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-sm">R</div>
            <span className="font-heading font-bold text-brand-800">FLE<span className="text-accent-500">by</span>Rayane</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 pb-12">{children}</div>
      </div>
    </div>
  );
}