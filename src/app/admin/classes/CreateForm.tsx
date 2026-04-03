"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
export default function CreateClassroomForm() {
  const router = useRouter();
  const [name, setName] = useState(""); const [desc, setDesc] = useState(""); const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false); const [result, setResult] = useState<{code:string;name:string}|null>(null);
  async function onSubmit(e: FormEvent) {
    e.preventDefault(); if (!name.trim()) return; setLoading(true);
    const res = await fetch("/api/classrooms", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({name, description:desc}) });
    const data = await res.json();
    if (res.ok) { setResult({code:data.code,name:data.name}); setName(""); setDesc(""); router.refresh(); }
    setLoading(false);
  }
  if (!open) return <button onClick={()=>setOpen(true)} className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">+ Créer une classe</button>;
  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6">
      {result ? <div className="text-center"><span className="text-4xl">🎉</span><h3 className="font-heading text-xl font-bold text-slate-900 mt-2">Classe « {result.name} » créée !</h3><p className="text-4xl font-mono font-black text-brand-600 my-4 tracking-[0.3em]">{result.code}</p><p className="text-sm text-slate-400 mb-4">Partagez ce code avec vos élèves</p><button onClick={()=>{setResult(null);setOpen(false)}} className="text-sm text-slate-500">Fermer</button></div> :
      <form onSubmit={onSubmit} className="space-y-4">
        <h3 className="font-heading font-bold text-lg text-slate-900">Nouvelle classe</h3>
        <input type="text" required value={name} onChange={e=>setName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-400" placeholder="Nom de la classe" />
        <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none" placeholder="Description (optionnel)" />
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 transition-all">{loading?"Création…":"Créer"}</button>
          <button type="button" onClick={()=>setOpen(false)} className="px-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl">Annuler</button>
        </div>
      </form>}
    </div>
  );
}
