"use client";
import { useRouter } from "next/navigation";
export default function UnassignActivityBtn({ classroomId, activityId }: { classroomId: string; activityId: string }) {
  const router = useRouter();
  return <button onClick={async () => { if (!confirm("Retirer cette activite ?")) return; await fetch(`/api/classrooms/${classroomId}/activities`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityId }) }); router.refresh(); }} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Retirer</button>;
}