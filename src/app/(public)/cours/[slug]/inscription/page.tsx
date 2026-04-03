"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CourseEnrollPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null);
    const courseRes = await fetch(`/api/cours/${slug}`);
    if (!courseRes.ok) { setError("Cours non trouvé."); setLoading(false); return; }
    const course = await courseRes.json();
    const res = await fetch("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId: course.id, enrollmentCode: code }) });
    const data = await res.json();
    if (!res.ok) { setError(data.message); setLoading(false); return; }
    router.push(`/cours/${slug}`); router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-white rounded-2xl border border-brand-100 p-8 text-center">
        <span className="text-5xl">🔒</span>
        <h1 className="font-heading text-2xl font-bold text-brand-900 mt-4">Cours protégé</h1>
        <p className="text-brand-400 mt-2 mb-6">Entrez le code d&apos;inscription donné par votre professeur</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" required value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6}
            className="w-full border border-brand-200 rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.3em] focus:ring-2 focus:ring-brand-400 outline-none uppercase" placeholder="ABC123" />
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-glow disabled:opacity-50 transition-all">
            {loading ? "Vérification…" : "S'inscrire au cours"}
          </button>
        </form>
      </div>
    </div>
  );
}
