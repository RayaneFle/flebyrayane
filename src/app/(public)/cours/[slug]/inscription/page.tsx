"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CourseEnrollPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [course, setCourse] = useState<{ id: string; title: string; level?: string; description?: string } | null>(null);

  // Load course info on mount
  useEffect(() => {
    fetch("/api/cours/" + slug)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCourse(data); })
      .catch(() => {});
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    if (!course) {
      setError("Cours non trouvé.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id, enrollmentCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Code incorrect.");
        setLoading(false);
        return;
      }
      setSuccess("Inscription validée ! Redirection...");
      setTimeout(() => {
        router.push("/cours/" + slug);
        router.refresh();
      }, 1500);
    } catch {
      setError("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/cours" className="hover:text-brand-600 transition-colors">Cours</Link>
        <span className="text-slate-300">/</span>
        {course && <Link href={"/cours/" + slug} className="hover:text-brand-600 transition-colors truncate max-w-[200px]">{course.title}</Link>}
        {course && <span className="text-slate-300">/</span>}
        <span className="text-slate-700 font-medium">Inscription</span>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="text-center mb-6">
            <span className="text-5xl">&#128274;</span>
            <h1 className="font-heading text-2xl font-bold text-slate-900 mt-3">Cours protégé</h1>
            {course ? (
              <>
                <p className="text-sm text-slate-600 mt-2">Pour accéder au cours</p>
                <p className="font-heading font-bold text-lg text-brand-700 mt-1">{course.title}</p>
                {course.level && <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">{course.level}</span>}
              </>
            ) : (
              <p className="text-sm text-slate-500 mt-2">Chargement...</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 text-center">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 text-center font-semibold">&#10003; {success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 text-center">Code d'inscription</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={loading || !!success || !course}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.4em] focus:ring-2 focus:ring-brand-400 focus:border-brand-400 outline-none uppercase transition-all disabled:bg-slate-50"
                placeholder="ABC123"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !!success || code.length < 4 || !course}
              className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-3 rounded-xl font-semibold hover:shadow-glow disabled:opacity-50 transition-all"
            >
              {loading ? "Vérification..." : success ? "Redirection..." : "S’inscrire au cours"}
            </button>
          </form>
        </div>

        {/* Help sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-heading font-bold text-slate-900 text-sm mb-2">&#128161; Pas de code ?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Demande à ton professeur le code d’inscription. Il l’a défini lors de la création du cours.</p>
          </div>
          <div className="bg-brand-50 rounded-2xl border border-brand-200 p-5">
            <h3 className="font-heading font-bold text-brand-900 text-sm mb-2">&#127919; Cours libres</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">Tu peux accéder à d’autres cours sans inscription :</p>
            <Link href="/cours" className="block text-center text-xs font-semibold text-white bg-gradient-to-r from-brand-500 to-accent-500 py-2 rounded-lg hover:shadow-md transition-all">
              Voir tous les cours &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
