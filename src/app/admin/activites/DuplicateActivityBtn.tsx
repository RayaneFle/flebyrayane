"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DuplicateActivityBtn({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    if (!confirm("Dupliquer cette activité ?")) return;
    setLoading(true);
    const res = await fetch("/api/activities/" + activityId + "/duplicate", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      router.push("/admin/activites/" + data.id + "/modifier");
      router.refresh();
    } else {
      alert("Erreur lors de la duplication.");
    }
    setLoading(false);
  }

  return (
    <button onClick={handleDuplicate} disabled={loading} className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium disabled:opacity-50">
      {loading ? "..." : "Dupliquer"}
    </button>
  );
}