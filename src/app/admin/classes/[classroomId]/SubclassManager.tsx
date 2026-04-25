"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member { id: string; userId: string; subclassId: string | null; user: { name: string | null; email: string | null } }
interface Subclass { id: string; name: string }

export default function SubclassManager({ classroomId, members, subclasses }: { classroomId: string; members: Member[]; subclasses: Subclass[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function createSubclass() {
    if (!newName.trim()) return;
    setCreating(true);
    await fetch("/api/classrooms/" + classroomId + "/subclasses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName(""); setCreating(false); router.refresh();
  }

  async function deleteSubclass(id: string) {
    if (!confirm("Supprimer cette sous-classe ? Les élèves ne seront pas supprimés.")) return;
    await fetch("/api/classrooms/" + classroomId + "/subclasses/" + id, { method: "DELETE" });
    router.refresh();
  }

  async function assignMember(userId: string, subclassId: string | null) {
    await fetch("/api/classrooms/" + classroomId + "/members/" + userId + "/subclass", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subclassId }),
    });
  }

  async function assignSelected(subclassId: string) {
    const promises = Array.from(selected).map(userId => assignMember(userId, subclassId));
    await Promise.all(promises);
    setSelected(new Set()); setAddingTo(null); router.refresh();
  }

  async function removeFromSubclass(userId: string) {
    await assignMember(userId, null);
    router.refresh();
  }

  function toggleSelect(userId: string) {
    const s = new Set(selected);
    if (s.has(userId)) s.delete(userId); else s.add(userId);
    setSelected(s);
  }

  const unassigned = members.filter(m => !m.subclassId);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && createSubclass()} placeholder="Nouvelle sous-classe..." className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-400" />
        <button onClick={createSubclass} disabled={creating || !newName.trim()} className="px-3 py-1.5 bg-brand-500 text-white text-xs font-bold rounded-lg hover:bg-brand-600 disabled:opacity-50">+</button>
      </div>

      {subclasses.map(sc => {
        const scMembers = members.filter(m => m.subclassId === sc.id);
        const isAdding = addingTo === sc.id;
        return (
          <div key={sc.id} className="border border-brand-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-brand-50">
              <p className="text-sm font-bold text-brand-800">{sc.name} <span className="text-xs font-normal text-slate-400">({scMembers.length})</span></p>
              <div className="flex items-center gap-2">
                <button onClick={() => { setAddingTo(isAdding ? null : sc.id); setSelected(new Set()); }} className={"text-[10px] px-2 py-0.5 rounded font-bold " + (isAdding ? "bg-brand-500 text-white" : "bg-white text-brand-600 border border-brand-200")}>
                  {isAdding ? "Annuler" : "+ Ajouter"}
                </button>
                <button onClick={() => deleteSubclass(sc.id)} className="text-[10px] text-red-400 hover:text-red-600">x</button>
              </div>
            </div>

            {scMembers.length > 0 && (
              <div className="px-3 py-2 flex flex-wrap gap-1.5">
                {scMembers.map(m => (
                  <span key={m.id} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-lg">
                    {m.user.name}
                    <button onClick={() => removeFromSubclass(m.userId)} className="text-red-400 hover:text-red-600 ml-0.5">x</button>
                  </span>
                ))}
              </div>
            )}

            {isAdding && unassigned.length > 0 && (
              <div className="px-3 py-2 border-t border-brand-50 bg-white">
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {unassigned.map(m => (
                    <label key={m.id} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded cursor-pointer">
                      <input type="checkbox" checked={selected.has(m.userId)} onChange={() => toggleSelect(m.userId)} className="accent-brand-500" />
                      <span className="text-xs text-slate-700">{m.user.name}</span>
                      <span className="text-[10px] text-slate-400">{m.user.email}</span>
                    </label>
                  ))}
                </div>
                {selected.size > 0 && (
                  <button onClick={() => assignSelected(sc.id)} className="mt-2 w-full py-1.5 bg-brand-500 text-white text-xs font-bold rounded-lg hover:bg-brand-600">
                    Ajouter {selected.size} élève{selected.size > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            )}

            {isAdding && unassigned.length === 0 && (
              <p className="px-3 py-2 text-[10px] text-slate-400 text-center border-t border-brand-50">Tous les élèves sont assignés.</p>
            )}
          </div>
        );
      })}

      {unassigned.length > 0 && subclasses.length > 0 && (
        <p className="text-[10px] text-slate-400 text-center">{unassigned.length} élève{unassigned.length > 1 ? "s" : ""} non assigné{unassigned.length > 1 ? "s" : ""}</p>
      )}
    </div>
  );
}