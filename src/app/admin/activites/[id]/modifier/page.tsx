"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { activityTypeLabels } from "@/lib/utils";

const LEVELS = ["A1","A2","B1","B2","C1","C2"];

function ImageUpload({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) { const d = await res.json(); onChange(d.url); }
    setUploading(false);
  }
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <label className="px-3 py-1.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-brand-100">
          {uploading ? "Upload..." : "Image"}<input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
        <input value={value || ""} onChange={e => onChange(e.target.value)} className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none" placeholder="ou URL" />
        {value && <img src={value} alt="" className="w-8 h-8 rounded object-cover" />}
      </div>
    </div>
  );
}

export default function EditActivityPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [level, setLevel] = useState("");
  const [pub, setPub] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State per type - same as creation form
  const [qcm, setQcm] = useState<any[]>([]);
  const [tf, setTf] = useState<any[]>([]);
  const [fb, setFb] = useState("");
  const [pairs, setPairs] = useState<any[]>([]);
  const [memory, setMemory] = useState<any[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [ddZones, setDdZones] = useState<any[]>([]);
  const [ddItems, setDdItems] = useState<any[]>([]);
  const [sort, setSort] = useState<string[]>([]);
  const [sortInst, setSortInst] = useState("");
  const [cats, setCats] = useState<any[]>([]);
  const [catItems, setCatItems] = useState<any[]>([]);
  const [catInst, setCatInst] = useState("");
  const [sentences, setSentences] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/activities/${id}`).then(r => r.json()).then(a => {
      setType(a.type);
      setTitle(a.title || "");
      setDesc(a.description || "");
      setLevel(a.level || "");
      setPub(a.isPublic);
      const cfg = typeof a.config === "string" ? JSON.parse(a.config) : a.config;
      switch (a.type) {
        case "QCM": setQcm(cfg.questions || []); break;
        case "TRUE_FALSE": setTf(cfg.questions || []); break;
        case "FILL_BLANKS": setFb(cfg.text || ""); break;
        case "MATCHING": setPairs(cfg.pairs || []); break;
        case "MEMORY": setMemory(cfg.pairs || []); break;
        case "HANGMAN": setWords(cfg.words || []); break;
        case "DRAG_DROP":
          if (cfg.zones) {
            setDdZones(cfg.zones.map((z: any) => ({ name: z.name, imageUrl: z.imageUrl || "" })));
            setDdItems(cfg.zones.flatMap((z: any) => (z.items || []).map((it: any) => ({ text: it.text || "", imageUrl: it.imageUrl || "", zone: z.name }))));
          } else if (cfg.pairs) {
            const zones: any = {};
            cfg.pairs.forEach((p: any) => { if (!zones[p.target]) zones[p.target] = { name: p.target, imageUrl: p.targetImage || "" }; });
            setDdZones(Object.values(zones));
            setDdItems(cfg.pairs.map((p: any) => ({ text: p.item, imageUrl: p.itemImage || "", zone: p.target })));
          }
          break;
        case "SORTING": setSort(cfg.items || []); setSortInst(cfg.instruction || ""); break;
        case "WORD_ORDER": setSentences(cfg.sentences || []); break;
        case "WORD_ORDER": setSentences(cfg.sentences || []); break;
        case "CATEGORIZE":
          setCats((cfg.categories || []).map((c: any) => typeof c === "string" ? { name: c, imageUrl: "" } : c));
          setCatItems(cfg.items || []);
          setCatInst(cfg.instruction || "");
          break;
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  function buildConfig() {
    switch (type) {
      case "QCM": return { questions: qcm };
      case "TRUE_FALSE": return { questions: tf };
      case "FILL_BLANKS": return { text: fb, caseSensitive: false };
      case "MATCHING": return { pairs: pairs.filter(p => (p.left || p.leftImage) && (p.right || p.rightImage)), instruction: "Associez les éléments" };
      case "MEMORY": return { pairs: memory.filter(p => (p.front || p.frontImage) && (p.back || p.backImage)) };
      case "HANGMAN": return { words };
      case "DRAG_DROP": return { zones: ddZones.filter(z => z.name || z.imageUrl).map(z => ({ ...z, items: ddItems.filter(i => i.zone === (z.name || z.imageUrl) && (i.text || i.imageUrl)).map(i => ({ text: i.text, imageUrl: i.imageUrl })) })), instruction: "Glissez dans la bonne zone" };
      case "SORTING": return { items: sort.filter(Boolean), correctOrder: sort.filter(Boolean), instruction: sortInst };
      case "CATEGORIZE": return { categories: cats.filter(c => c.name || c.imageUrl), items: catItems.filter(i => (i.text || i.imageUrl) && i.category), instruction: catInst };
      case "WORD_ORDER": return { sentences: sentences.filter((s: any) => s.text?.trim()) };
      default: return {};
    }
  }

  async function save() {
    if (!title.trim()) { setError("Titre requis."); return; }
    setSaving(true); setError(null);
    const res = await fetch(`/api/activities/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: desc, level: level || null, isPublic: pub, config: buildConfig() }),
    });
    if (res.ok) { router.push("/admin/activites"); router.refresh(); }
    else { setError("Erreur."); }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Chargement...</div>;

  const info = activityTypeLabels[type] || { emoji: "?", label: type };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">{info.emoji}</span>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Modifier : {info.label}</h1>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-brand-100 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Titre *</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none" /></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Niveau</label><select value={level} onChange={e => setLevel(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none"><option value="">Tous</option>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Visibilité</label><select value={pub?"1":"0"} onChange={e => setPub(e.target.value==="1")} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 outline-none"><option value="1">Public</option><option value="0">Privé</option></select></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <h2 className="font-heading font-bold text-slate-800 mb-4">Contenu</h2>

          {type === "QCM" && <div className="space-y-4">{qcm.map((q, qi) => <div key={qi} className="p-4 bg-slate-50 rounded-xl space-y-3">
            <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Q{qi+1}</span>{qcm.length>1 && <button type="button" onClick={() => setQcm(qcm.filter((_,i) => i!==qi))} className="text-xs text-red-500">x</button>}</div>
            <input value={q.question||""} onChange={e => { const u=[...qcm]; u[qi]={...u[qi],question:e.target.value}; setQcm(u); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Question" />
            <ImageUpload value={q.imageUrl||""} onChange={v => { const u=[...qcm]; u[qi]={...u[qi],imageUrl:v}; setQcm(u); }} label="Image" />
            {(q.options||[]).map((o: string, oi: number) => <div key={oi} className="flex items-center gap-2"><input type="radio" name={`eq${qi}`} checked={q.correctIndex===oi} onChange={() => { const u=[...qcm]; u[qi]={...u[qi],correctIndex:oi}; setQcm(u); }} className="accent-green-600" /><input value={o} onChange={e => { const u=[...qcm]; const opts=[...u[qi].options]; opts[oi]=e.target.value; u[qi]={...u[qi],options:opts}; setQcm(u); }} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />{(q.options||[]).length > 2 && <button type="button" onClick={() => { const u=[...qcm]; const opts=u[qi].options.filter((_:any,j:number)=>j!==oi); u[qi]={...u[qi],options:opts,correctIndex:u[qi].correctIndex>=opts.length?0:u[qi].correctIndex}; setQcm(u); }} className="text-red-400 text-xs shrink-0">x</button>}</div>)}
            <button type="button" onClick={() => { const u=[...qcm]; u[qi]={...u[qi],options:[...u[qi].options,""]}; setQcm(u); }} className="text-xs text-brand-600 font-medium mt-1">+ Ajouter une réponse</button>
            <input value={q.explanation||""} onChange={e => { const u=[...qcm]; u[qi]={...u[qi],explanation:e.target.value}; setQcm(u); }} className="w-full border border-slate-100 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Explication" />
          </div>)}<button type="button" onClick={() => setQcm([...qcm, {question:"",imageUrl:"",options:["",""],correctIndex:0,explanation:""}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-brand-400">+ Question</button></div>}

          {type === "TRUE_FALSE" && <div className="space-y-4">{tf.map((q, i) => <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-3">
            <input value={q.statement||""} onChange={e => { const u=[...tf]; u[i]={...u[i],statement:e.target.value}; setTf(u); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />
            <ImageUpload value={q.imageUrl||""} onChange={v => { const u=[...tf]; u[i]={...u[i],imageUrl:v}; setTf(u); }} label="Image" />
            <div className="flex gap-4"><label className="text-sm flex items-center gap-2"><input type="radio" checked={q.isTrue} onChange={() => { const u=[...tf]; u[i]={...u[i],isTrue:true}; setTf(u); }} />Vrai</label><label className="text-sm flex items-center gap-2"><input type="radio" checked={!q.isTrue} onChange={() => { const u=[...tf]; u[i]={...u[i],isTrue:false}; setTf(u); }} />Faux</label></div>
            {tf.length > 1 && <button type="button" onClick={() => setTf(tf.filter((_:any, j:number) => j !== i))} className="text-xs text-red-500 mt-1">Supprimer</button>}
          </div>)}<button type="button" onClick={() => setTf([...tf, {statement:"",imageUrl:"",isTrue:true,explanation:""}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-brand-400">+ Affirmation</button></div>}

          {type === "FILL_BLANKS" && <div><p className="text-sm text-slate-400 mb-2">Mots a masquer : {"{{mot}}"}</p><textarea value={fb} onChange={e => setFb(e.target.value)} rows={6} className="w-full border border-slate-200 rounded-xl px-4 py-3 font-mono text-sm outline-none" /></div>}

          {type === "MATCHING" && <div className="space-y-3">{pairs.map((p, i) => <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={p.left||""} onChange={e => { const u=[...pairs]; u[i]={...u[i],left:e.target.value}; setPairs(u); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Gauche" />
              <input value={p.right||""} onChange={e => { const u=[...pairs]; u[i]={...u[i],right:e.target.value}; setPairs(u); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Droite" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ImageUpload value={p.leftImage||""} onChange={v => { const u=[...pairs]; u[i]={...u[i],leftImage:v}; setPairs(u); }} label="Image gauche" />
              <ImageUpload value={p.rightImage||""} onChange={v => { const u=[...pairs]; u[i]={...u[i],rightImage:v}; setPairs(u); }} label="Image droite" />
            </div>
            {pairs.length>1 && <button type="button" onClick={() => setPairs(pairs.filter((_,j)=>j!==i))} className="text-xs text-red-500">Supprimer</button>}
          </div>)}<button type="button" onClick={() => setPairs([...pairs, {left:"",right:"",leftImage:"",rightImage:""}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-brand-400">+ Paire</button></div>}

          {type === "MEMORY" && <div className="space-y-3">{memory.map((p, i) => <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={p.front||""} onChange={e => { const u=[...memory]; u[i]={...u[i],front:e.target.value}; setMemory(u); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Recto" />
              <input value={p.back||""} onChange={e => { const u=[...memory]; u[i]={...u[i],back:e.target.value}; setMemory(u); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Verso" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ImageUpload value={p.frontImage||""} onChange={v => { const u=[...memory]; u[i]={...u[i],frontImage:v}; setMemory(u); }} label="Image recto" />
              <ImageUpload value={p.backImage||""} onChange={v => { const u=[...memory]; u[i]={...u[i],backImage:v}; setMemory(u); }} label="Image verso" />
            </div>
            {memory.length>1 && <button type="button" onClick={() => setMemory(memory.filter((_,j)=>j!==i))} className="text-xs text-red-500">Supprimer</button>}
          </div>)}<button type="button" onClick={() => setMemory([...memory, {front:"",back:"",frontImage:"",backImage:""}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-brand-400">+ Paire</button></div>}

          {type === "HANGMAN" && <div className="space-y-2">{words.map((w, i) => <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
            <div className="flex gap-2"><input value={w.word||""} onChange={e => { const u=[...words]; u[i]={...u[i],word:e.target.value}; setWords(u); }} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Mot" /><input value={w.hint||""} onChange={e => { const u=[...words]; u[i]={...u[i],hint:e.target.value}; setWords(u); }} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Indice" /></div>
            <ImageUpload value={w.imageUrl||""} onChange={v => { const u=[...words]; u[i]={...u[i],imageUrl:v}; setWords(u); }} label="Image" />
            {words.length > 1 && <button type="button" onClick={() => setWords(words.filter((_:any, j:number) => j !== i))} className="text-xs text-red-500 mt-1">Supprimer</button>}
          </div>)}<button type="button" onClick={() => setWords([...words, {word:"",hint:"",imageUrl:""}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-brand-400">+ Mot</button></div>}

          {type === "SORTING" && <div className="space-y-3"><input value={sortInst} onChange={e => setSortInst(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Instruction" />{sort.map((s, i) => <div key={i} className="flex items-center gap-2"><span className="text-xs text-slate-300 w-6">{i+1}.</span><input value={s} onChange={e => { const u=[...sort]; u[i]=e.target.value; setSort(u); }} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />{sort.length > 1 && <button onClick={() => setSort(sort.filter((_,j)=>j!==i))} className="text-red-400 p-1">x</button>}</div>)}<button onClick={() => setSort([...sort, ""])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-brand-400">+ Élément</button></div>}

          {type === "WORD_ORDER" && <div className="space-y-3">
            {sentences.map((s: any, i: number) => <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
              <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">Phrase {i+1}</span>{sentences.length>1 && <button type="button" onClick={() => setSentences(sentences.filter((_: any,j: number)=>j!==i))} className="text-xs text-red-500">x</button>}</div>
              <input value={s.text||""} onChange={e => { const u=[...sentences]; u[i]={...u[i], text:e.target.value}; setSentences(u); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Phrase" />
              <input value={s.hint||""} onChange={e => { const u=[...sentences]; u[i]={...u[i], hint:e.target.value}; setSentences(u); }} className="w-full border border-slate-100 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Indice (optionnel)" />
            </div>)}
            <button type="button" onClick={() => setSentences([...sentences, {text:"",hint:""}])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-brand-400">+ Phrase</button>
          </div>}

          {type === "CATEGORIZE" && <div className="space-y-4"><input value={catInst} onChange={e => setCatInst(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Instruction" />
            <div><p className="text-xs font-bold text-slate-500 mb-2">Catégories :</p>{cats.map((c, i) => <div key={i} className="p-3 bg-slate-50 rounded-xl mb-2 space-y-2">
              <input value={c.name||""} onChange={e => { const u=[...cats]; u[i]={...u[i],name:e.target.value}; setCats(u); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Catégorie" />
              <ImageUpload value={c.imageUrl||""} onChange={v => { const u=[...cats]; u[i]={...u[i],imageUrl:v}; setCats(u); }} label="Image" />
              {cats.length>2 && <button type="button" onClick={() => setCats(cats.filter((_,j)=>j!==i))} className="text-xs text-red-500">Supprimer</button>}
            </div>)}<button onClick={() => setCats([...cats, {name:"",imageUrl:""}])} className="text-xs text-brand-600 font-medium">+ Catégorie</button></div>
            <div><p className="text-xs font-bold text-slate-500 mb-2">Éléments :</p>{catItems.map((it, i) => <div key={i} className="p-3 bg-slate-50 rounded-xl mb-2 space-y-2">
              <div className="flex gap-2"><input value={it.text||""} onChange={e => { const u=[...catItems]; u[i]={...u[i],text:e.target.value}; setCatItems(u); }} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Texte" /><select value={it.category||""} onChange={e => { const u=[...catItems]; u[i]={...u[i],category:e.target.value}; setCatItems(u); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"><option value="">Cat...</option>{cats.filter(c=>c.name||c.imageUrl).map(c=><option key={c.name||c.imageUrl} value={c.name||c.imageUrl}>{c.name||"(image)"}</option>)}</select></div>
              <ImageUpload value={it.imageUrl||""} onChange={v => { const u=[...catItems]; u[i]={...u[i],imageUrl:v}; setCatItems(u); }} label="Image" />
              {catItems.length>1 && <button type="button" onClick={() => setCatItems(catItems.filter((_,j)=>j!==i))} className="text-xs text-red-500">Supprimer</button>}
            </div>)}<button onClick={() => setCatItems([...catItems, {text:"",category:"",imageUrl:""}])} className="text-xs text-brand-600 font-medium">+ Élément</button></div>
          </div>}

          {type === "DRAG_DROP" && <div className="space-y-4">
            <div><p className="text-xs font-bold text-slate-500 mb-2">Zones :</p>{ddZones.map((z, i) => <div key={i} className="p-3 bg-slate-50 rounded-xl mb-2 space-y-2">
              <input value={z.name||""} onChange={e => { const u=[...ddZones]; u[i]={...u[i],name:e.target.value}; setDdZones(u); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Zone" />
              <ImageUpload value={z.imageUrl||""} onChange={v => { const u=[...ddZones]; u[i]={...u[i],imageUrl:v}; setDdZones(u); }} label="Image zone" />
              {ddZones.length>2 && <button type="button" onClick={() => setDdZones(ddZones.filter((_,j)=>j!==i))} className="text-xs text-red-500">Supprimer</button>}
            </div>)}<button onClick={() => setDdZones([...ddZones, {name:"",imageUrl:""}])} className="text-xs text-brand-600 font-medium">+ Zone</button></div>
            <div><p className="text-xs font-bold text-slate-500 mb-2">Éléments :</p>{ddItems.map((it, i) => <div key={i} className="p-3 bg-slate-50 rounded-xl mb-2 space-y-2">
              <div className="flex gap-2"><input value={it.text||""} onChange={e => { const u=[...ddItems]; u[i]={...u[i],text:e.target.value}; setDdItems(u); }} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Texte" /><select value={it.zone||""} onChange={e => { const u=[...ddItems]; u[i]={...u[i],zone:e.target.value}; setDdItems(u); }} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"><option value="">Zone...</option>{ddZones.filter(z=>z.name||z.imageUrl).map(z=><option key={z.name||z.imageUrl} value={z.name||z.imageUrl}>{z.name||"(image)"}</option>)}</select></div>
              <ImageUpload value={it.imageUrl||""} onChange={v => { const u=[...ddItems]; u[i]={...u[i],imageUrl:v}; setDdItems(u); }} label="Image" />
              {ddItems.length>1 && <button type="button" onClick={() => setDdItems(ddItems.filter((_,j)=>j!==i))} className="text-xs text-red-500">Supprimer</button>}
            </div>)}<button onClick={() => setDdItems([...ddItems, {text:"",zone:"",imageUrl:""}])} className="text-xs text-brand-600 font-medium">+ Élément</button></div>
          </div>}
        </div>

        <div className="flex gap-4">
          <button onClick={save} disabled={saving} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 transition-all">{saving ? "Sauvegarde..." : "Sauvegarder"}</button>
          <button onClick={() => router.back()} className="px-8 py-3 bg-slate-50 text-slate-600 font-semibold rounded-xl">Annuler</button>
        </div>
      </div>
    </div>
  );
}