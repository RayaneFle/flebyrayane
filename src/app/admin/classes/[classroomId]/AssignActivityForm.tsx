"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AssignActivityForm({ classroomId, activities }: { classroomId: string; activities: { id: string; title: string; type: string; level: string | null }[] }) {
  const router = useRouter();
  const [activityId, setActivityId] = useState("");
  const [loading, setLoading] = useState(false);
  async function assign() {
    if (!activityId) return; setLoading(true);
    await fetch(`/api/classrooms/${classroomId}/activities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityId }) });
    setActivityId(""); setLoading(false); router.refresh();
  }
  if (activities.length === 0) return <p className="text-xs text-slate-400">Toutes les activites sont assignees.</p>;
  return (
    <div className="flex gap-2">
      <select value={activityId} onChange={e => setActivityId(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none">
        <option value="">Assigner une activité...</option>
        {activities.map(a => <option key={a.id} value={a.id}>{a.title} ({a.type}{a.level ? " " + a.level : ""})</option>)}
      </select>
      <button onClick={assign} disabled={!activityId || loading} className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50">+</button>
    </div>
  );
}