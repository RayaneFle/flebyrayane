"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
export default function ProfilPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ type: "ok"|"err"; text: string }|null>(null);
  const [current, setCurrent] = useState(""); const [newPw, setNewPw] = useState(""); const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok"|"err"; text: string }|null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string|null>(null);
  useEffect(() => {
    if (session?.user) { setName(session.user.name || ""); setEmail(session.user.email || ""); }
  }, [session]);
  async function updateInfo(e: React.FormEvent) {
    e.preventDefault(); setInfoMsg(null); setInfoLoading(true);
    const res = await fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email }) });
    const data = await res.json();
    if (!res.ok) { setInfoMsg({ type: "err", text: data.message }); setInfoLoading(false); return; }
    setInfoMsg({ type: "ok", text: "Informations mises à jour !" });
    await update();
    setInfoLoading(false);
  }
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
  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault(); setDeleteError(null); setDeleteLoading(true);
    const res = await fetch("/api/user/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: deletePw }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.message || "Erreur lors de la suppression.");
      setDeleteLoading(false);
      return;
    }
    await signOut({ redirect: false });
    router.push("/");
  }
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-8">Mon profil</h1>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Informations</h2>
          {infoMsg && <div className={`text-sm px-4 py-3 rounded-xl mb-4 ${infoMsg.type === "ok" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"}`}>{infoMsg.text}</div>}
          <form onSubmit={updateInfo} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nom</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} maxLength={100} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} maxLength={200} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none text-sm" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Rôle</p>
              <p className="font-medium text-slate-800 capitalize">{session?.user?.role}</p>
            </div>
            <button type="submit" disabled={infoLoading} className="w-full bg-gradient-to-r from-brand-500 to-accent-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-glow disabled:opacity-50 transition-all">{infoLoading ? "Enregistrement…" : "Enregistrer"}</button>
          </form>
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
      <div className="bg-white rounded-2xl border border-brand-100 p-6 mb-6">
        <h2 className="font-heading font-bold text-slate-800 mb-2">📦 Mes données (RGPD)</h2>
        <p className="text-sm text-slate-500 mb-4">Conformément au RGPD, vous pouvez télécharger toutes les données que nous détenons sur vous dans un fichier lisible.</p>
        <a href="/api/user/export" download className="inline-block px-5 py-2.5 bg-brand-100 text-brand-700 font-semibold rounded-xl hover:bg-brand-200 transition-colors text-sm">Télécharger mes données (JSON)</a>
      </div>
      <div className="bg-white rounded-2xl border border-red-200 p-6">
        <h2 className="font-heading font-bold text-red-800 mb-2">⚠️ Supprimer mon compte</h2>
        <p className="text-sm text-slate-500 mb-4">La suppression de votre compte est définitive. Toutes vos données (progression, scores, inscriptions) seront effacées et ne pourront pas être récupérées.</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} className="inline-block px-5 py-2.5 bg-red-50 text-red-700 font-semibold rounded-xl hover:bg-red-100 transition-colors text-sm border border-red-200">Supprimer mon compte</button>
        ) : (
          <form onSubmit={deleteAccount} className="space-y-3">
            <p className="text-sm font-semibold text-red-800">Confirmez votre mot de passe pour supprimer votre compte :</p>
            {deleteError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{deleteError}</div>}
            <input type="password" required value={deletePw} onChange={e => setDeletePw(e.target.value)} className="w-full border border-red-200 rounded-xl px-4 py-2.5 outline-none text-sm" placeholder="Votre mot de passe" />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowDelete(false); setDeletePw(""); setDeleteError(null); }} className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-semibold hover:bg-slate-200 transition-all text-sm">Annuler</button>
              <button type="submit" disabled={deleteLoading} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 transition-all text-sm">{deleteLoading ? "Suppression…" : "Supprimer définitivement"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
