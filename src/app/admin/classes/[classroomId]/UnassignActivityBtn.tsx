"use client";
import { useRef, useState } from "react";

export default function UnassignActivityBtn({ classroomId, activityId }: { classroomId: string; activityId: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading) return;
    if (!confirm("Retirer cette activité ?")) return;
    setLoading(true);
    const row = ref.current?.closest("[data-classroom-activity-card]") as HTMLElement | null;
    if (row) row.style.display = "none";
    try {
      const res = await fetch("/api/classrooms/" + classroomId + "/activities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });
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
    <button ref={ref} onClick={handle} disabled={loading} className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
      Retirer
    </button>
  );
}
