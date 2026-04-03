"use client";
import { useRouter } from "next/navigation";
export default function DeleteCourseInline({ courseId, canDelete }: { courseId: string; canDelete: boolean }) {
  const router = useRouter();
  if (!canDelete) return null;
  return <button onClick={async () => { if (!confirm("Supprimer ce cours ?")) return; await fetch(`/api/admin/courses/${courseId}`, { method: "DELETE" }); router.refresh(); }} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Supprimer</button>;
}