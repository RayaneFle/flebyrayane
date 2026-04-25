"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("8 caractères minimum."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.message); setLoading(false); return; }
    const login = await signIn("credentials", { email, password, redirect: false });
    if (login?.error) window.location.href = "/login"; else { window.location.href = "/dashboard"; }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Créer votre compte</h1>
        <p className="text-sm text-slate-400 mt-1">Rejoignez la plateforme en quelques secondes</p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet</label>
          <input type="text" required value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
            placeholder="Votre nom" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
            placeholder="vous@exemple.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mot de passe</label>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
            placeholder="8 caractères minimum" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmer le mot de passe</label>
          <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none transition-all"
            placeholder="Retapez votre mot de passe" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all text-sm">
          {loading ? "Inscription..." : "Créer mon compte"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-400 mt-8">Déjà un compte ? <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">Se connecter</Link></p>
    </div>
  );
}