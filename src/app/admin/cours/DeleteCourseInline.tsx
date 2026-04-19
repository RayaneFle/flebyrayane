"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  courseId: string;
  canDelete: boolean;
  onDeleted?: () => void;
}

export default function DeleteCourseInline({ courseId, canDelete, onDeleted }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!canDelete) return null;

  async function handleDelete() {
    if (loading) return;
    if (!confirm("Supprimer ce cours ?")) return;

    setLoading(true);
    // UI optimiste : prévenir le parent IMMÉDIATEMENT
    if (onDeleted) onDeleted();

    try {
      const res = await fetch("/api/admin/courses/" + courseId, { method: "DELETE" });
      if (!res.ok) {
        alert("Erreur lors de la suppression. Rechargez la page.");
      }
    } catch {
      alert("Erreur réseau. Rechargez la page.");
    }
    setLoading(false);
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
      🗑 Supprimer
    </button>
  );
}
