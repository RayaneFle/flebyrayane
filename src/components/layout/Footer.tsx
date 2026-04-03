import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-brand-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-xs">R</div>
            <span className="font-heading font-bold text-brand-800">FLE<span className="text-accent-500">by</span>Rayane</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-brand-400">
            <Link href="/cours" className="hover:text-brand-600 transition-colors">Cours</Link>
            <Link href="/activites" className="hover:text-brand-600 transition-colors">Activités</Link>
          </nav>
          <p className="text-xs text-brand-300">© {new Date().getFullYear()} FLEbyRayane</p>
        </div>
      </div>
    </footer>
  );
}
