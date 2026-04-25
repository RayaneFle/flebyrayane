"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    } else {
      window.location.href = callbackUrl;
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-slate-900">Content de vous revoir</h1>
        <p className="text-sm text-slate-400 mt-1">Connectez-vous pour continuer</p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
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
            placeholder="Votre mot de passe" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all text-sm">
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p className="text-center text-sm text-slate-400 mt-8">Pas encore de compte ? <Link href="/register" className="text-brand-600 font-semibold hover:text-brand-700">Creer un compte</Link></p>
    </div>
  );
}
