"use client";
export default function DeleteUserBtn({ userId, email, currentUserEmail, onDeleted }: { userId: string; email: string; currentUserEmail: string; onDeleted?: () => void }) {
  if (email === currentUserEmail) return null;

  async function handleDelete() {
    const confirmed = confirm("Supprimer le compte de " + email + " ?\n\nCette action est irreversible. Toutes les donnees de cet utilisateur seront supprimees (scores, progressions, inscriptions, etc.).");
    if (!confirmed) return;
    const doubleConfirm = confirm("Derniere confirmation : voulez-vous vraiment supprimer definitivement ce compte ?");
    if (!doubleConfirm) return;
    const res = await fetch("/api/admin/users/" + userId, { method: "DELETE" });
    if (res.ok) onDeleted?.();
    else alert("Erreur lors de la suppression.");
  }

  return <button onClick={handleDelete} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">Supprimer</button>;
}
