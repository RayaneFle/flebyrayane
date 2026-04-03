"use client";
import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (password !== confirm) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 6) { setError("6 caractères minimum."); return; }
    setLoading(true);
    const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.message); setLoading(false); return; }
    const login = await signIn("credentials", { email, password, redirect: false });
    if (login?.error) router.push("/login"); else { router.push("/dashboard"); router.refresh(); }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-heading font-black text-2xl mx-auto mb-4 shadow-glow">R</div>
        <h1 className="font-heading text-3xl font-bold text-brand-900">Créer un compte</h1>
      </div>
      <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-brand-700 mb-1">Nom</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border border-brand-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none" placeholder="Marie Dupont" /></div>
          <div><label className="block text-sm font-medium text-brand-700 mb-1">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-brand-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none" placeholder="vous@exemple.com" /></div>
          <div><label className="block text-sm font-medium text-brand-700 mb-1">Mot de passe</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-brand-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none" placeholder="6 caractères min" /></div>
          <div><label className="block text-sm font-medium text-brand-700 mb-1">Confirmer</label><input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full border border-brand-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none" /></div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-glow disabled:opacity-50 transition-all">{loading ? "Inscription…" : "Créer mon compte"}</button>
        </form>
      </div>
      <p className="text-center text-sm text-brand-400 mt-6">Déjà un compte ? <Link href="/login" className="text-accent-600 font-semibold">Se connecter</Link></p>
    </div>
  );
}
