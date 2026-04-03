"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
export default function JoinClassPage() {
  const router = useRouter();
  const [code, setCode] = useState(""); const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null); const [success, setSuccess] = useState<string|null>(null);
  async function onSubmit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError(null); setSuccess(null);
    const res = await fetch("/api/classrooms", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({code:code.trim().toUpperCase()}) });
    const data = await res.json();
    if (!res.ok) { setError(data.message); setLoading(false); return; }
    setSuccess(`Vous avez rejoint « ${data.classroom.name} » !`);
    setLoading(false); setTimeout(() => router.push("/dashboard"), 2000);
  }
  return (
    <div><h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">Rejoindre une classe</h1><p className="text-slate-400 mb-8">Entrez le code de votre professeur</p>
      <div className="bg-white rounded-2xl border border-brand-100 p-8 max-w-md">
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">{success}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="text" required value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] focus:ring-2 focus:ring-brand-400 outline-none uppercase" placeholder="ABC123" />
          <button type="submit" disabled={loading||code.length<4} className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-glow disabled:opacity-50 transition-all">{loading?"Vérification…":"Rejoindre"}</button>
        </form>
      </div>
    </div>
  );
}
