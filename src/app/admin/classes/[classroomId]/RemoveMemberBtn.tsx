"use client";
import { useRef, useState } from "react";

export default function RemoveMemberBtn({ classroomId, userId }: { classroomId: string; userId: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading) return;
    if (!confirm("Retirer cet élève de la classe ?")) return;
    setLoading(true);
    const row = ref.current?.closest("[data-classroom-member-card]") as HTMLElement | null;
    if (row) row.style.display = "none";
    try {
      const res = await fetch("/api/classrooms/" + classroomId + "/members/" + userId, { method: "DELETE" });
      if (!res.ok) {
        if (row) row.style.display = "";
        alert("Erreur lors du retrait.");
      }
    } catch {
      if (row) row.style.display = "";
      alert("Erreur réseau.");
    }
    setLoading(false);
  }

  return (
    <button ref={ref} onClick={handle} disabled={loading} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shrink-0 disabled:opacity-50 transition-colors" aria-label="Retirer">
      ✕
    </button>
  );
}
