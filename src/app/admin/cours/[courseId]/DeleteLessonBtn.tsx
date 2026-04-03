"use client";
import { useRouter } from "next/navigation";
export default function DeleteLessonBtn({ courseId, sectionId, lessonId }: { courseId: string; sectionId: string; lessonId: string }) {
  const router = useRouter();
  return <button onClick={async () => { if (!confirm("Supprimer cette lecon ?")) return; await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, { method: "DELETE" }); router.refresh(); }} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Supprimer</button>;
}