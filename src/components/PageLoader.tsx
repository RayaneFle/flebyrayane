"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageLoader() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href && link.href.startsWith(window.location.origin) && !link.href.includes("#") && !link.target) {
        const url = new URL(link.href);
        if (url.pathname !== pathname) {
          setLoading(true);
        }
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-500 animate-pulse flex items-center justify-center">
          <span className="text-white font-heading font-black text-2xl">R</span>
        </div>
        <div className="absolute -inset-2 rounded-3xl border-2 border-brand-200 animate-ping opacity-30"></div>
      </div>
      <div className="mt-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{"animationDelay": "0ms"}}></div>
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{"animationDelay": "150ms"}}></div>
        <div className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{"animationDelay": "300ms"}}></div>
      </div>
      <p className="mt-4 text-sm text-slate-400 font-medium">Chargement...</p>
    </div>
  );
}