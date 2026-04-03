export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 animate-pulse flex items-center justify-center">
        <span className="text-white font-heading font-bold text-lg">R</span>
      </div>
      <p className="mt-4 text-sm text-slate-400">Chargement...</p>
    </div>
  );
}
