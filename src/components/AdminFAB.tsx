"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminFAB() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  if (!pathname?.startsWith("/admin")) return null;

  const actions = [
    { href: "/admin/activites/creer", label: "Activite", icon: "+" },
    { href: "/admin/cours/creer", label: "Cours", icon: "+" },
    { href: "/admin/classes", label: "Classe", icon: "+" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2 mb-2 animate-fade-in-up">
          {actions.map(a => (
            <Link key={a.href} href={a.href} onClick={() => setOpen(false)}
              className="flex items-center gap-2 bg-white border border-slate-200 shadow-lg rounded-xl px-4 py-2.5 hover:bg-brand-50 transition-all text-sm font-medium text-slate-700">
              <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold">{a.icon}</span>
              {a.label}
            </Link>
          ))}
        </div>
      )}
      <button onClick={() => setOpen(!open)}
        className={"w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl font-bold transition-all " +
          (open ? "bg-slate-500 rotate-45" : "bg-gradient-to-br from-brand-500 to-accent-500 hover:shadow-xl hover:scale-105")}>
        +
      </button>
    </div>
  );
}