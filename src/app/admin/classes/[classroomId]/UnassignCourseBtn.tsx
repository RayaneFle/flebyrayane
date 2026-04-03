"use client";
import { useRouter } from "next/navigation";
export default function UnassignCourseBtn({ classroomId, courseId }: { classroomId: string; courseId: string }) {
  const router = useRouter();
  return <button onClick={async () => { if (!confirm("Retirer ce cours ?")) return; await fetch(`/api/classrooms/${classroomId}/courses`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId }) }); router.refresh(); }} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Retirer</button>;
}