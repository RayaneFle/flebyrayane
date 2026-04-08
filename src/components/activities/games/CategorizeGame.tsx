"use client";
import { useState, useRef } from "react";

export default function CategorizeGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: any[]) => void }) {
  const [placements, setPlacements] = useState<Map<string, string>>(new Map());
  const [dragging, setDragging] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Map<string, boolean>>(new Map());
  const ref = useRef<string | null>(null);
  const [shuffled] = useState(() => [...config.items].sort(() => Math.random() - 0.5));

  function key(i: any, idx?: number) { return i.text || i.imageUrl || "item" + (idx ?? 0); }
  const unplaced = shuffled.filter((i: any) => !placements.has(key(i)));
  function getIn(cat: string) { return shuffled.filter((i: any) => placements.get(key(i)) === cat); }
  const colors = ["from-teal-50 to-teal-100 border-teal-200","from-cyan-50 to-cyan-100 border-cyan-200","from-emerald-50 to-emerald-100 border-emerald-200","from-sky-50 to-sky-100 border-sky-200"];

  function dragStart(t: string) { setDragging(t); ref.current = t; }
  function drop(cat: string) { const t = ref.current; if (!t) return; const np = new Map(placements); np.set(t, cat); setPlacements(np); setDragging(null); ref.current = null; }
  function tap(t: string) { if (dragging === t) setDragging(null); else { setDragging(t); ref.current = t; } }
  function tapCat(cat: string) { if (!dragging) return; drop(cat); }
  function remove(t: string) { if (checked) return; const np = new Map(placements); np.delete(t); setPlacements(np); }

  function check() {
    const r = new Map<string, boolean>();
    config.items.forEach((i: any) => r.set(key(i), placements.get(key(i)) === i.category));
    setResults(r); setChecked(true);
    const details = config.items.map((i: any) => ({ question: i.text || i.imageUrl || "?", userAnswer: placements.get(key(i)) || "(non place)", correctAnswer: i.category, isCorrect: r.get(key(i)) || false, imageUrl: i.imageUrl }));
    onComplete((Array.from(r.values()).filter(Boolean).length / config.items.length) * 100, details);
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      <p className="text-sm text-slate-400 mb-2">{config.instruction || "Triez les elements"}</p>
      <p className="text-xs text-slate-300 mb-6">{placements.size}/{config.items.length} tries</p>
      <div className="flex flex-wrap gap-3 mb-8 min-h-[60px] p-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
        {unplaced.length === 0 && !checked && <p className="text-xs text-slate-300 m-auto">Tous tries !</p>}
        {unplaced.map((i: any) => (
          <div key={key(i)} draggable onDragStart={() => dragStart(key(i))} onDragEnd={() => { setDragging(null); ref.current = null; }} onClick={() => tap(key(i))}
            className={`px-4 py-2 rounded-xl font-medium text-sm cursor-grab select-none transition-all flex items-center gap-2 ${dragging === key(i) ? "bg-brand-500 text-white scale-105 shadow-lg" : "bg-white text-slate-700 border border-slate-200 hover:border-brand-300"}`}>
            {i.imageUrl && <img src={i.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />}
            {i.text && <span>{i.text}</span>}
            {!i.text && !i.imageUrl && <span>?</span>}
          </div>
        ))}
      </div>
      <div className={`grid gap-4 ${config.categories.length <= 2 ? "grid-cols-2" : "sm:grid-cols-3"}`}>
        {config.categories.map((cat: any, ci: number) => {
          const catName = typeof cat === "string" ? cat : cat.name;
          const catImg = typeof cat === "string" ? null : cat.imageUrl;
          const items = getIn(catName);
          return (
            <div key={catName} onDragOver={e => e.preventDefault()} onDrop={() => drop(catName)} onClick={() => tapCat(catName)}
              className={`p-4 rounded-xl border-2 bg-gradient-to-b ${colors[ci % colors.length]} min-h-[120px] transition-all ${dragging ? "ring-2 ring-brand-200" : ""}`}>
              <div className="text-center mb-3">
                {catImg && <img src={catImg} alt="" className="w-12 h-12 rounded-lg mx-auto mb-1 object-cover" />}
                <p className="text-sm font-bold text-slate-700">{catName}</p>
              </div>
              <div className="space-y-1.5">
                {items.map((i: any) => { const ok = checked ? results.get(key(i)) : null;
                  return (
                    <div key={key(i)} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium ${checked ? ok ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800" : "bg-white/80 text-slate-700"}`}>
                      <span className="flex items-center gap-2">
                        {i.imageUrl && <img src={i.imageUrl} alt="" className="w-6 h-6 rounded object-cover" />}
                        {i.text || ""}{checked && ok && " ✅"}{checked && !ok && " ❌"}
                      </span>
                      {!checked && <button onClick={e => { e.stopPropagation(); remove(key(i)); }} className="text-slate-300 hover:text-red-500 text-xs ml-2">x</button>}
                    </div>
                  );
                })}
                {items.length === 0 && <p className="text-xs text-slate-300 text-center italic py-2">Deposez ici</p>}
              </div>
            </div>
          );
        })}
      </div>
      {!checked && <div className="mt-6 text-center"><button onClick={check} disabled={placements.size !== config.items.length} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-40 transition-all">Verifier</button></div>}
    </div>
  );
}