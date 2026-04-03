"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddSectionForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(""); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!title.trim()) return; setLoading(true);
    await fetch(`/api/admin/courses/${courseId}/sections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
    setTitle(""); setOpen(false); setLoading(false); router.refresh();
  }

  if (!open) return <button onClick={() => setOpen(true)} className="w-full py-4 border-2 border-dashed border-brand-200 rounded-2xl text-sm font-medium text-brand-400 hover:border-brand-400 hover:text-brand-600">+ Ajouter une section</button>;

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-brand-100 p-5 flex gap-3">
      <input type="text" value={title} onChange={e => setTitle(e.target.value)} autoFocus className="flex-1 border border-brand-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-400 outline-none" placeholder="Titre de la section" />
      <button type="submit" disabled={loading} className="px-5 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl">{loading ? "…" : "Créer"}</button>
      <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 bg-brand-50 text-brand-500 text-sm rounded-xl">✕</button>
    </form>
  );
}
