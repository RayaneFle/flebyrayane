"use client";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function ProfilPage() {
  const { data: session } = useSession();
  const [current, setCurrent] = useState(""); const [newPw, setNewPw] = useState(""); const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok"|"err"; text: string }|null>(null);

  async function changePw(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (newPw !== confirm) { setMsg({ type: "err", text: "Les mots de passe ne correspondent pas." }); return; }
    if (newPw.length < 8) { setMsg({ type: "err", text: "8 caractères minimum." }); return; }
    setLoading(true);
    const res = await fetch("/api/user/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: newPw }) });
    const data = await res.json();
    if (!res.ok) setMsg({ type: "err", text: data.message });
    else { setMsg({ type: "ok", text: "Mot de passe modifié !" }); setCurrent(""); setNewPw(""); setConfirm(""); }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-8">Mon profil</h1>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Informations</h2>
          <div className="space-y-3">
            <div><p className="text-xs text-slate-400">Nom</p><p className="font-medium text-slate-800">{session?.user?.name || "—"}</p></div>
            <div><p className="text-xs text-slate-400">Email</p><p className="font-medium text-slate-800">{session?.user?.email}</p></div>
            <div><p className="text-xs text-slate-400">Rôle</p><p className="font-medium text-slate-800 capitalize">{session?.user?.role}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">🔒 Changer le mot de passe</h2>
          {msg && <div className={`text-sm px-4 py-3 rounded-xl mb-4 ${msg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>{msg.text}</div>}
          <form onSubmit={changePw} className="space-y-3">
            <input type="password" required value={current} onChange={e => setCurrent(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm" placeholder="Mot de passe actuel" />
            <input type="password" required value={newPw} onChange={e => setNewPw(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm" placeholder="Nouveau mot de passe" />
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm" placeholder="Confirmer" />
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-glow disabled:opacity-50 transition-all">{loading ? "Modification…" : "Modifier"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
