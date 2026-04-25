"use client";
import dynamic from "next/dynamic";
const TiptapEditor = dynamic(() => import("@/components/TiptapEditor"), { ssr: false });
import { useState, useEffect, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { activityTypeLabels } from "@/lib/utils";

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const sectionId = params.sectionId as string;
  const lessonId = params.lessonId as string;

  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showPicker, setShowPicker] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState<number | null>(null);
  const [createType, setCreateType] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createConfig, setCreateConfig] = useState<any>(null);
  const [creating, setCreating] = useState(false);

  const gameTypes = [
    { key:"QCM", label:"QCM", emoji:"\ud83d\udcdd", def:{ questions:[{question:"",options:["",""],correctIndex:0,explanation:""}] } },
    { key:"TRUE_FALSE", label:"Vrai/Faux", emoji:"\u2705", def:{ questions:[{statement:"",isTrue:true}] } },
    { key:"FILL_BLANKS", label:"Texte à trous", emoji:"\u270f\ufe0f", def:{ text:"", caseSensitive:false } },
    { key:"MATCHING", label:"Appariement", emoji:"\ud83d\udd17", def:{ pairs:[{left:"",right:""}] } },
    { key:"MEMORY", label:"Memory", emoji:"\ud83c\udccf", def:{ pairs:[{front:"",back:""}] } },
    { key:"HANGMAN", label:"Pendu", emoji:"\ud83d\udc80", def:{ words:[{word:"",hint:""}] } },
    { key:"SORTING", label:"Classement", emoji:"\ud83d\udcca", def:{ items:["",""],correctOrder:["",""],instruction:"" } },
    { key:"WORD_ORDER", label:"Mots dans l'ordre", emoji:"\ud83d\udd24", def:{ sentences:[{text:"",hint:""}] } },
    { key:"CATEGORIZE", label:"Catégorisation", emoji:"\ud83d\udcc2", def:{ categories:[{name:"",imageUrl:""},{name:"",imageUrl:""}], items:[{text:"",category:"",imageUrl:""}], instruction:"" } },
    { key:"DRAG_DROP", label:"Glisser-déposer", emoji:"\ud83c\udfaf", def:{ zones:[{name:"",imageUrl:""},{name:"",imageUrl:""}], items:[], instruction:"" } },
  ];

  function startCreate(idx: number) { setShowCreate(idx); setShowPicker(null); setCreateType(""); setCreateTitle(""); setCreateConfig(null); }
  function pickType(t: string) { setCreateType(t); const g=gameTypes.find(x=>x.key===t); setCreateConfig(g?JSON.parse(JSON.stringify(g.def)):{}); }

  async function createAndInsert(idx: number) {
    if(!createTitle||!createType||!createConfig) return;
    setCreating(true);
    const res = await fetch("/api/activities", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({title:createTitle,type:createType,config: createType==="DRAG_DROP" ? { zones: (createConfig.zones||[]).filter((z:any)=>z.name||z.imageUrl).map((z:any)=>({...z, items:(createConfig.items||[]).filter((i:any)=>i.zone===(z.name||z.imageUrl)&&(i.text||i.imageUrl)).map((i:any)=>({text:i.text,imageUrl:i.imageUrl}))})), instruction:"Glissez dans la bonne zone" } : createType==="CATEGORIZE" ? { categories:(createConfig.categories||[]).filter((c:any)=>c.name||c.imageUrl), items:(createConfig.items||[]).filter((i:any)=>(i.text||i.imageUrl)&&i.category), instruction:createConfig.instruction||"" } : createConfig, isPublic:true}) });
    if(res.ok) {
      const act = await res.json();
      const nb = { id:"new-"+Date.now(), type:"activity" as const, content:null, activityId:act.id, requireScore:false, minScore:60, activity:act };
      const a=[...blocks]; a.splice(idx+1,0,nb); setBlocks(a);
      fetch("/api/activities").then(r=>r.json()).then(setActivities);
    }
    setCreating(false); setShowCreate(null);
  }

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`).then(r => r.json()),
      fetch("/api/activities").then(r => r.json()),
    ]).then(([lesson, acts]) => {
      setTitle(lesson.title || "");
      setBlocks(lesson.blocks || []);
      setActivities(acts);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [courseId, sectionId, lessonId]);

  // Warn before leaving if unsaved changes
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Ctrl+S to save
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const form = document.querySelector("form");
        if (form) form.requestSubmit();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function addTextBlock() { setBlocks([...blocks, { id: "new-" + Date.now(), type: "text", content: "", activityId: null, requireScore: false, minScore: 60 }]); setDirty(true); }
  function insertActivity(idx: number, act: any) {
    const nb = { id: "new-" + Date.now(), type: "activity", content: null, activityId: act.id, requireScore: false, minScore: 60, activity: act };
    const nb2 = [...blocks]; nb2.splice(idx + 1, 0, nb); setBlocks(nb2); setShowPicker(null);
  }
  function updateBlock(idx: number, updates: any) { const u = [...blocks]; u[idx] = { ...u[idx], ...updates }; setBlocks(u); setDirty(true); }
  function removeBlock(idx: number) { setBlocks(blocks.filter((_, i) => i !== idx)); setDirty(true); }
  function moveBlock(idx: number, dir: string) {
    const ni = dir === "up" ? idx - 1 : idx + 1; if (ni < 0 || ni >= blocks.length) return;
    const u = [...blocks]; [u[idx], u[ni]] = [u[ni], u[idx]]; setBlocks(u); setDirty(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault(); if (!title.trim()) { setError("Titre requis."); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, blocks: blocks.map((b, i) => ({ position: i, type: b.type, content: b.content || null, activityId: b.activityId || null, requireScore: b.requireScore || false, minScore: b.minScore || 60 })) }),
      });
      if (res.ok) {
        setDirty(false);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      } else {
        setError("Erreur de sauvegarde.");
      }
    } catch {
      setError("Erreur réseau.");
    }
    setSaving(false);
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Chargement...</div>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-slate-900 mb-8">Modifier la lecon</h1>
      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{error}</div>}
      <form onSubmit={save} className="space-y-6">
        <div className="bg-white rounded-2xl border border-brand-100 p-6">
          <label className="block text-sm font-medium text-slate-600 mb-1">Titre *</label>
          <input type="text" required value={title} onChange={e => { setTitle(e.target.value); setDirty(true); }} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-400 outline-none text-lg font-heading" />
        </div>
        <div className="space-y-3">
          {blocks.map((block, idx) => (
            <div key={block.id || idx} className="relative">
              {block.type === "text" ? (
                <div className="bg-white rounded-2xl border border-brand-100 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-400">Bloc texte</p>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveBlock(idx, "up")} disabled={idx === 0} className="text-xs text-slate-300 hover:text-slate-600 disabled:opacity-20 p-1">▲</button>
                      <button type="button" onClick={() => moveBlock(idx, "down")} disabled={idx === blocks.length - 1} className="text-xs text-slate-300 hover:text-slate-600 disabled:opacity-20 p-1">▼</button>
                      <button type="button" onClick={() => removeBlock(idx)} className="text-xs text-red-400 hover:text-red-600 p-1 ml-2">x</button>
                    </div>
                  </div>
                  <TiptapEditor content={block.content || ""} onChange={val => updateBlock(idx, { content: val })} />
                </div>
              ) : (
                <div className="bg-brand-50 rounded-2xl border-2 border-brand-200 p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{activityTypeLabels[block.activity?.type]?.emoji || "🎮"}</span>
                      <p className="text-sm font-bold text-slate-800">{block.activity?.title || "Activite"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveBlock(idx, "up")} disabled={idx === 0} className="text-xs text-slate-300 disabled:opacity-20 p-1">▲</button>
                      <button type="button" onClick={() => moveBlock(idx, "down")} disabled={idx === blocks.length - 1} className="text-xs text-slate-300 disabled:opacity-20 p-1">▼</button>
                      <button type="button" onClick={() => removeBlock(idx)} className="text-xs text-red-400 p-1 ml-2">x</button>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                    <input type="checkbox" checked={block.requireScore} onChange={e => updateBlock(idx, { requireScore: e.target.checked })} className="accent-brand-500" />
                    Score minimum requis
                  </label>
                  {block.requireScore && <input type="number" value={block.minScore} onChange={e => updateBlock(idx, { minScore: parseInt(e.target.value) || 0 })} className="w-20 border border-slate-200 rounded-lg px-3 py-1 text-sm outline-none mt-2" min="0" max="100" />}
                </div>
              )}
              <div className="flex justify-center mt-1">
                <button type="button" onClick={() => {setShowPicker(showPicker===idx?null:idx);setShowCreate(null);}} className="text-xs px-3 py-1 bg-brand-100 text-brand-700 rounded-full hover:bg-brand-200 font-medium">+ Insérer existante</button>
                <button type="button" onClick={() => startCreate(idx)} className="text-xs px-3 py-1 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 font-medium">+ Créer ici</button>
              </div>
              {showPicker === idx && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-4 mt-2 max-h-60 overflow-y-auto animate-slide-down">
                  {activities.length === 0 ? <p className="text-xs text-slate-300">Aucune activité.</p> :
                    activities.map((a: any) => (
                      <button key={a.id} type="button" onClick={() => insertActivity(idx, a)} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-brand-50 text-sm">
                        <span>{activityTypeLabels[a.type]?.emoji || "📝"}</span>
                        <span className="font-medium text-slate-700">{a.title}</span>
                      </button>
                    ))}
                </div>
              )}

              {showCreate === idx && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mt-2">
                  {!createType ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-3">Type d’activité :</p>
                      <div className="grid grid-cols-3 gap-2">{gameTypes.map(g => (
                        <button key={g.key} type="button" onClick={()=>pickType(g.key)} className="p-3 bg-white rounded-xl border border-slate-200 hover:border-brand-300 text-center">
                          <span className="text-xl">{g.emoji}</span><p className="text-xs font-medium text-slate-700 mt-1">{g.label}</p>
                        </button>
                      ))}</div>
                      <button type="button" onClick={()=>setShowCreate(null)} className="text-xs text-slate-400 mt-3">Annuler</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-700">{gameTypes.find(g=>g.key===createType)?.emoji} {gameTypes.find(g=>g.key===createType)?.label}</p>
                        <button type="button" onClick={()=>setCreateType("")} className="text-xs text-slate-400">Changer</button>
                      </div>
                      <input value={createTitle} onChange={e=>setCreateTitle(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Titre de l’activité" />

                      {createType==="QCM" && <div className="space-y-2">
                        {createConfig?.questions?.map((q:any,qi:number) => (
                          <div key={qi} className="p-3 bg-white rounded-lg space-y-2">
                            <input value={q.question||""} onChange={e=>{const c={...createConfig};c.questions[qi]={...q,question:e.target.value};setCreateConfig({...c});}} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Question" />
                            {(q.options||[]).map((o:string,oi:number)=>(<div key={oi} className="flex items-center gap-2"><input type="radio" name={`eq${qi}`} checked={q.correctIndex===oi} onChange={()=>{const c={...createConfig};c.questions[qi]={...q,correctIndex:oi};setCreateConfig({...c});}} className="accent-green-600" /><input value={o} onChange={e=>{const c={...createConfig};const opts=[...q.options];opts[oi]=e.target.value;c.questions[qi]={...q,options:opts};setCreateConfig({...c});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder={`Option ${String.fromCharCode(65+oi)}`} /></div>))}
                            {createConfig.questions.length>1 && <button type="button" onClick={()=>{const c={...createConfig};c.questions=c.questions.filter((_:any,i:number)=>i!==qi);setCreateConfig({...c});}} className="text-xs text-red-500">Supprimer</button>}
                          </div>
                        ))}
                        <button type="button" onClick={()=>{const c={...createConfig};c.questions=[...c.questions,{question:"",options:["",""],correctIndex:0}];setCreateConfig({...c});}} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">+ Question</button>
                      </div>}

                      {createType==="TRUE_FALSE" && <div className="space-y-2">
                        {createConfig?.questions?.map((q:any,i:number) => (
                          <div key={i} className="p-3 bg-white rounded-lg space-y-2">
                            <input value={q.statement||""} onChange={e=>{const c={...createConfig};c.questions[i]={...q,statement:e.target.value};setCreateConfig({...c});}} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Affirmation" />
                            <div className="flex gap-4"><label className="text-sm"><input type="radio" checked={q.isTrue} onChange={()=>{const c={...createConfig};c.questions[i]={...q,isTrue:true};setCreateConfig({...c});}} /> Vrai</label><label className="text-sm"><input type="radio" checked={!q.isTrue} onChange={()=>{const c={...createConfig};c.questions[i]={...q,isTrue:false};setCreateConfig({...c});}} /> Faux</label></div>
                            {createConfig.questions.length>1 && <button type="button" onClick={()=>{const c={...createConfig};c.questions=c.questions.filter((_:any,j:number)=>j!==i);setCreateConfig({...c});}} className="text-xs text-red-500">Supprimer</button>}
                          </div>
                        ))}
                        <button type="button" onClick={()=>{const c={...createConfig};c.questions=[...c.questions,{statement:"",isTrue:true}];setCreateConfig({...c});}} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">+ Affirmation</button>
                      </div>}

                      {createType==="FILL_BLANKS" && <textarea value={createConfig?.text||""} onChange={e=>setCreateConfig({...createConfig,text:e.target.value})} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none" placeholder={"Je {{suis}} français."} />}

                      {createType==="MATCHING" && <div className="space-y-2">
                        {createConfig?.pairs?.map((p:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={p.left||""} onChange={e=>{const c={...createConfig};c.pairs[i]={...p,left:e.target.value};setCreateConfig({...c});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Gauche" /><input value={p.right||""} onChange={e=>{const c={...createConfig};c.pairs[i]={...p,right:e.target.value};setCreateConfig({...c});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Droite" />{createConfig.pairs.length>1&&<button type="button" onClick={()=>{const c={...createConfig};c.pairs=c.pairs.filter((_:any,j:number)=>j!==i);setCreateConfig({...c});}} className="text-red-400 text-xs">x</button>}</div>))}
                        <button type="button" onClick={()=>{const c={...createConfig};c.pairs=[...c.pairs,{left:"",right:""}];setCreateConfig({...c});}} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">+ Paire</button>
                      </div>}

                      {createType==="MEMORY" && <div className="space-y-2">
                        {createConfig?.pairs?.map((p:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={p.front||""} onChange={e=>{const c={...createConfig};c.pairs[i]={...p,front:e.target.value};setCreateConfig({...c});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Recto" /><input value={p.back||""} onChange={e=>{const c={...createConfig};c.pairs[i]={...p,back:e.target.value};setCreateConfig({...c});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Verso" />{createConfig.pairs.length>1&&<button type="button" onClick={()=>{const c={...createConfig};c.pairs=c.pairs.filter((_:any,j:number)=>j!==i);setCreateConfig({...c});}} className="text-red-400 text-xs">x</button>}</div>))}
                        <button type="button" onClick={()=>{const c={...createConfig};c.pairs=[...c.pairs,{front:"",back:""}];setCreateConfig({...c});}} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">+ Paire</button>
                      </div>}

                      {createType==="HANGMAN" && <div className="space-y-2">
                        {createConfig?.words?.map((w:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={w.word||""} onChange={e=>{const c={...createConfig};c.words[i]={...w,word:e.target.value};setCreateConfig({...c});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Mot" /><input value={w.hint||""} onChange={e=>{const c={...createConfig};c.words[i]={...w,hint:e.target.value};setCreateConfig({...c});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Indice" />{createConfig.words.length>1&&<button type="button" onClick={()=>{const c={...createConfig};c.words=c.words.filter((_:any,j:number)=>j!==i);setCreateConfig({...c});}} className="text-red-400 text-xs">x</button>}</div>))}
                        <button type="button" onClick={()=>{const c={...createConfig};c.words=[...c.words,{word:"",hint:""}];setCreateConfig({...c});}} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">+ Mot</button>
                      </div>}

                      {createType==="SORTING" && <div className="space-y-2">
                        {createConfig?.items?.map((s:string,i:number)=>(<div key={i} className="flex items-center gap-2"><span className="text-xs w-4">{i+1}.</span><input value={s} onChange={e=>{const c={...createConfig};c.items[i]=e.target.value;c.correctOrder[i]=e.target.value;setCreateConfig({...c});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" />{createConfig.items.length>1&&<button type="button" onClick={()=>{const c={...createConfig};c.items=c.items.filter((_:any,j:number)=>j!==i);c.correctOrder=c.correctOrder.filter((_:any,j:number)=>j!==i);setCreateConfig({...c});}} className="text-red-400 text-xs">x</button>}</div>))}
                        <button type="button" onClick={()=>{const c={...createConfig};c.items=[...c.items,""];c.correctOrder=[...c.correctOrder,""];setCreateConfig({...c});}} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">+ Élément</button>
                      </div>}

                      {createType==="WORD_ORDER" && <div className="space-y-2">
                        {createConfig?.sentences?.map((s:any,i:number)=>(<div key={i} className="p-2 bg-white rounded-lg space-y-1">
                          <input value={s.text||""} onChange={e=>{const c={...createConfig};c.sentences[i]={...s,text:e.target.value};setCreateConfig({...c});}} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Phrase" />
                          <input value={s.hint||""} onChange={e=>{const c={...createConfig};c.sentences[i]={...s,hint:e.target.value};setCreateConfig({...c});}} className="w-full border border-slate-100 rounded-lg px-3 py-1 text-xs outline-none" placeholder="Indice" />
                          {createConfig.sentences.length>1&&<button type="button" onClick={()=>{const c={...createConfig};c.sentences=c.sentences.filter((_:any,j:number)=>j!==i);setCreateConfig({...c});}} className="text-red-400 text-xs">x</button>}
                        </div>))}
                        <button type="button" onClick={()=>{const c={...createConfig};c.sentences=[...c.sentences,{text:"",hint:""}];setCreateConfig({...c});}} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">+ Phrase</button>
                      </div>}

                      {createType==="CATEGORIZE" && <div className="space-y-3">
                        <input value={createConfig?.instruction||""} onChange={e=>setCreateConfig({...createConfig,instruction:e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Instruction" />
                        <p className="text-xs font-bold text-slate-500">Catégories :</p>
                        {createConfig?.categories?.map((c:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={c.name||""} onChange={e=>{const cfg={...createConfig};cfg.categories[i]={...c,name:e.target.value};setCreateConfig({...cfg});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder={`Cat ${i+1}`} />{createConfig.categories.length>2&&<button type="button" onClick={()=>{const cfg={...createConfig};cfg.categories=cfg.categories.filter((_:any,j:number)=>j!==i);setCreateConfig({...cfg});}} className="text-red-400 text-xs">x</button>}</div>))}
                        <button type="button" onClick={()=>{const cfg={...createConfig};cfg.categories=[...cfg.categories,{name:"",imageUrl:""}];setCreateConfig({...cfg});}} className="text-xs text-brand-600">+ Catégorie</button>
                        <p className="text-xs font-bold text-slate-500">Éléments :</p>
                        {createConfig?.items?.map((it:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={it.text||""} onChange={e=>{const cfg={...createConfig};cfg.items[i]={...it,text:e.target.value};setCreateConfig({...cfg});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Texte" /><select value={it.category||""} onChange={e=>{const cfg={...createConfig};cfg.items[i]={...it,category:e.target.value};setCreateConfig({...cfg});}} className="border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none"><option value="">Cat...</option>{createConfig.categories.filter((c:any)=>c.name).map((c:any)=><option key={c.name} value={c.name}>{c.name}</option>)}</select>{createConfig.items.length>1&&<button type="button" onClick={()=>{const cfg={...createConfig};cfg.items=cfg.items.filter((_:any,j:number)=>j!==i);setCreateConfig({...cfg});}} className="text-red-400 text-xs">x</button>}</div>))}
                        <button type="button" onClick={()=>{const cfg={...createConfig};cfg.items=[...cfg.items,{text:"",category:"",imageUrl:""}];setCreateConfig({...cfg});}} className="text-xs text-brand-600">+ Élément</button>
                      </div>}

                      {createType==="DRAG_DROP" && <div className="space-y-3">
                        <p className="text-xs font-bold text-slate-500">Zones :</p>
                        {createConfig?.zones?.map((z:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={z.name||""} onChange={e=>{const cfg={...createConfig};cfg.zones[i]={...z,name:e.target.value};setCreateConfig({...cfg});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder={`Zone ${i+1}`} />{createConfig.zones.length>2&&<button type="button" onClick={()=>{const cfg={...createConfig};cfg.zones=cfg.zones.filter((_:any,j:number)=>j!==i);setCreateConfig({...cfg});}} className="text-red-400 text-xs">x</button>}</div>))}
                        <button type="button" onClick={()=>{const cfg={...createConfig};cfg.zones=[...cfg.zones,{name:"",imageUrl:""}];setCreateConfig({...cfg});}} className="text-xs text-brand-600">+ Zone</button>
                        <p className="text-xs font-bold text-slate-500">Éléments :</p>
                        {(createConfig?.items||[]).map((it:any,i:number)=>(<div key={i} className="flex gap-2 items-center"><input value={it.text||""} onChange={e=>{const cfg={...createConfig};cfg.items[i]={...it,text:e.target.value};setCreateConfig({...cfg});}} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Texte" /><select value={it.zone||""} onChange={e=>{const cfg={...createConfig};cfg.items[i]={...it,zone:e.target.value};setCreateConfig({...cfg});}} className="border border-slate-200 rounded-lg px-2 py-2 text-sm outline-none"><option value="">Zone...</option>{createConfig.zones.filter((z:any)=>z.name).map((z:any)=><option key={z.name} value={z.name}>{z.name}</option>)}</select>{(createConfig.items||[]).length>1&&<button type="button" onClick={()=>{const cfg={...createConfig};cfg.items=cfg.items.filter((_:any,j:number)=>j!==i);setCreateConfig({...cfg});}} className="text-red-400 text-xs">x</button>}</div>))}
                        <button type="button" onClick={()=>{const cfg={...createConfig};cfg.items=[...(cfg.items||[]),{text:"",zone:"",imageUrl:""}];setCreateConfig({...cfg});}} className="text-xs text-brand-600">+ Élément</button>
                      </div>}

                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={()=>createAndInsert(idx)} disabled={!createTitle||creating} className="px-5 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-50">{creating?"Création...":"Créer et insérer"}</button>
                        <button type="button" onClick={()=>setShowCreate(null)} className="px-5 py-2 bg-slate-100 text-slate-500 text-sm rounded-lg">Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mb-4">
          <button type="button" onClick={addTextBlock} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-medium text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-all">+ Bloc texte</button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-50 transition-all inline-flex items-center gap-2">
            {saving && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {saving ? "Sauvegarde en cours..." : "Sauvegarder"}
          </button>
          <button type="button" onClick={() => { if (dirty && !confirm("Modifications non sauvegardees. Quitter quand meme ?")) return; router.push("/admin/cours/" + courseId); }} className="px-8 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Retour au cours</button>
          <span className="text-xs text-slate-400 ml-auto">Astuce: Ctrl+S pour sauvegarder</span>
          {dirty && !saving && !savedToast && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Modifications non sauvegardees</span>
          )}
        </div>
      </form>

      {savedToast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white font-semibold px-5 py-3 rounded-xl shadow-lg z-50 animate-fade-in-up flex items-center gap-2">
          <span>&#10003;</span>
          <span>Lecon enregistree</span>
        </div>
      )}
    </div>
  );
}