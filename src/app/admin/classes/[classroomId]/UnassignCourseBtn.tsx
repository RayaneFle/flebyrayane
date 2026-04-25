"use client";
import { useRef, useState } from "react";

export default function UnassignCourseBtn({ classroomId, courseId }: { classroomId: string; courseId: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (loading) return;
    if (!confirm("Retirer ce cours ?")) return;
    setLoading(true);
    const row = ref.current?.closest("[data-classroom-course-card]") as HTMLElement | null;
    if (row) row.style.display = "none";
    try {
      const res = await fetch("/api/classrooms/" + classroomId + "/courses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
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
