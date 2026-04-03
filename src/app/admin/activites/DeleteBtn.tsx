"use client";
import { useRouter } from "next/navigation";
export default function DeleteBtn({ id }: { id: string }) {
  const router = useRouter();
  return <button onClick={async () => { if (!confirm("Supprimer ?")) return; await fetch(`/api/activities/${id}`, { method:"DELETE" }); router.refresh(); }} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Supprimer</button>;
}
