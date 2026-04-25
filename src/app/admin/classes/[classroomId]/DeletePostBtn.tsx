"use client";
import { useRef, useState } from "react";

export default function DeletePostBtn({ classroomId, postId }: { classroomId: string; postId: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading) return;
    if (!confirm("Supprimer cette publication ?")) return;
    setLoading(true);
    const card = ref.current?.closest("[data-classroom-post-card]") as HTMLElement | null;
    if (card) card.style.display = "none";
    try {
      const res = await fetch("/api/classrooms/" + classroomId + "/posts/" + postId, { method: "DELETE" });
      if (!res.ok) {
        if (card) card.style.display = "";
        alert("Erreur lors de la suppression.");
      }
    } catch {
      if (card) card.style.display = "";
      alert("Erreur réseau.");
    }
    setLoading(false);
  }

  return (
    <button ref={ref} onClick={handle} disabled={loading} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shrink-0 disabled:opacity-50 transition-colors" aria-label="Supprimer">
      ✕
    </button>
  );
}
