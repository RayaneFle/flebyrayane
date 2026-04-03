"use client";
import { useRouter } from "next/navigation";
export default function DeletePostBtn({ classroomId, postId }: { classroomId: string; postId: string }) {
  const router = useRouter();
  return <button onClick={async () => { if (!confirm("Supprimer cette publication ?")) return; await fetch(`/api/classrooms/${classroomId}/posts/${postId}`, { method: "DELETE" }); router.refresh(); }} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shrink-0">x</button>;
}