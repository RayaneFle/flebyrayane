"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member { id: string; userId: string; subclassId: string | null; user: { name: string | null; email: string | null } }
interface Subclass { id: string; name: string }

export default function SubclassManager({ classroomId, members, subclasses }: { classroomId: string; members: Member[]; subclasses: Subclass[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function createSubclass() {
    if (!newName.trim()) return;
    setCreating(true);
    await fetch("/api/classrooms/" + classroomId + "/subclasses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setCreating(false);
    router.refresh();
  }

  async function deleteSubclass(id: string) {
    if (!confirm("Supprimer cette sous-classe ? Les eleves ne seront pas supprimes.")) return;
    await fetch("/api/classrooms/" + classroomId + "/subclasses/" + id, { method: "DELETE" });
    router.refresh();
  }

  async function assignMember(userId: string, subclassId: string | null) {
    await fetch("/api/classrooms/" + classroomId + "/members/" + userId + "/subclass", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subclassId }),
    });
    router.refresh();
  }

  const unassigned = members.filter(m => !m.subclassId);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom de la sous-classe (ex: 11A)" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-400" />
        <button onClick={createSubclass} disabled={creating || !newName.trim()} className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50">+ Creer</button>
      </div>

      {subclasses.length > 0 && (
        <div className="space-y-3">
          {subclasses.map(sc => {
            const scMembers = members.filter(m => m.subclassId === sc.id);
            return (
              <div key={sc.id} className="border-2 border-brand-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-brand-50 to-accent-50">
                  <p className="font-bold text-sm text-brand-800">{sc.name} <span className="text-xs font-normal text-slate-400">({scMembers.length})</span></p>
                  <button onClick={() => deleteSubclass(sc.id)} className="text-xs text-red-400 hover:text-red-600">Supprimer</button>
                </div>
                <div className="p-3">
                  {scMembers.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">Aucun eleve</p>
                  ) : (
                    <div className="space-y-1">{scMembers.map(m => (
                      <div key={m.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-200 flex items-center justify-center text-brand-700 text-[10px] font-bold">{m.user.name?.charAt(0) || "?"}</div>
                          <p className="text-xs text-slate-700">{m.user.name}</p>
                        </div>
                        <button onClick={() => assignMember(m.userId, null)} className="text-[10px] text-red-400 hover:text-red-600">Retirer</button>
                      </div>
                    ))}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unassigned.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-3">
          <p className="text-xs font-bold text-slate-500 mb-2">Non assignes ({unassigned.length}) :</p>
          <div className="space-y-1">{unassigned.map(m => (
            <div key={m.id} className="flex items-center justify-between py-1.5 px-2 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold">{m.user.name?.charAt(0) || "?"}</div>
                <p className="text-xs text-slate-700">{m.user.name}</p>
              </div>
              {subclasses.length > 0 && (
                <select onChange={e => { if (e.target.value) assignMember(m.userId, e.target.value); }} defaultValue="" className="text-[10px] border border-slate-200 rounded px-2 py-1 outline-none">
                  <option value="">Assigner...</option>
                  {subclasses.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                </select>
              )}
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}