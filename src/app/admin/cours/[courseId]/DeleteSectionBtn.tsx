"use client";
import { useRouter } from "next/navigation";
export default function DeleteSectionBtn({ courseId, sectionId }: { courseId: string; sectionId: string }) {
  const router = useRouter();
  return <button onClick={async () => { if (!confirm("Supprimer cette section et toutes ses lecons ?")) return; await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}`, { method: "DELETE" }); router.refresh(); }} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Supprimer</button>;
}