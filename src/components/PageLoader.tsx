"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function PageLoader() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Chargement...");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Hide loader when page changes
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  // Safety: auto-hide after 30s
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoading(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // Intercept navigation links
      const link = target.closest("a");
      if (link && link.href && link.href.startsWith(window.location.origin) && !link.href.includes("#") && !link.target && !link.hasAttribute("download")) {
        const url = new URL(link.href);
        if (url.pathname !== pathname) {
          setMessage("Chargement...");
          setLoading(true);
        }
      }

      // Intercept save/submit buttons (but NOT small action buttons like toggle, delete, assign)
      const button = target.closest("button");
      if (button && button.type === "submit") {
        const text = button.textContent?.toLowerCase() || "";
        if (text.includes("sauvegarder") || text.includes("creer") || text.includes("publier")) {
          setMessage("Sauvegarde...");
          setLoading(true);
        }
      }
    }

    function handleSubmit(e: Event) {
      const form = e.target as HTMLFormElement;
      if (form.tagName === "FORM") {
        setMessage("Sauvegarde...");
        setLoading(true);
      }
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("submit", handleSubmit);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("submit", handleSubmit);
    };
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
        <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{animationDelay: "0ms"}}></div>
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{animationDelay: "150ms"}}></div>
        <div className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{animationDelay: "300ms"}}></div>
      </div>
      <p className="mt-4 text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
}