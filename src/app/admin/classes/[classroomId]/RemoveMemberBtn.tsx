"use client";
import { useRouter } from "next/navigation";
export default function RemoveMemberBtn({ classroomId, userId }: { classroomId: string; userId: string }) {
  const router = useRouter();
  return <button onClick={async () => { if (!confirm("Retirer cet eleve de la classe ?")) return; await fetch(`/api/classrooms/${classroomId}/members/${userId}`, { method: "DELETE" }); router.refresh(); }} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shrink-0">x</button>;
}