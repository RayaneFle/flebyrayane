"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AssignCourseForm({ classroomId, courses }: { classroomId: string; courses: { id: string; title: string; level: string }[] }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(false);
  async function assign() {
    if (!courseId) return; setLoading(true);
    await fetch(`/api/classrooms/${classroomId}/courses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
    setCourseId(""); setLoading(false); router.refresh();
  }
  if (courses.length === 0) return <p className="text-xs text-slate-400">Tous les cours sont déjà assignés.</p>;
  return (
    <div className="flex gap-2">
      <select value={courseId} onChange={e => setCourseId(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none">
        <option value="">Assigner un cours…</option>
        {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.level})</option>)}
      </select>
      <button onClick={assign} disabled={!courseId || loading} className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50">+</button>
      <a href="/admin/cours/creer" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-amber-50 text-amber-700 text-sm font-semibold rounded-xl hover:bg-amber-100">Creer</a>
    </div>
  );
}
