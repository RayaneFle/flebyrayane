"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function AssignClassForm({ courseId, classrooms }: { courseId: string; classrooms: any[] }) {
  const router = useRouter();
  const [classroomId, setClassroomId] = useState("");
  async function assign() {
    if (!classroomId) return;
    await fetch(`/api/classrooms/${classroomId}/courses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) });
    setClassroomId(""); router.refresh();
  }
  return (
    <div className="flex gap-2">
      <select value={classroomId} onChange={e => setClassroomId(e.target.value)} className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none">
        <option value="">Assigner à une classe...</option>
        {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button onClick={assign} disabled={!classroomId} className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-xl hover:bg-brand-600 disabled:opacity-50">Assigner</button>
    </div>
  );
}