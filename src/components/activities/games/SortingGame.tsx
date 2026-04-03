"use client";
import { useState } from "react";

export default function SortingGame({ config, onComplete }: { config: any; onComplete: (s: number) => void }) {
  const [items, setItems] = useState(() => [...config.items].sort(() => Math.random() - 0.5));
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault(); if (dragIdx === null || dragIdx === i) return;
    const n = [...items]; const [d] = n.splice(dragIdx, 1); n.splice(i, 0, d); setItems(n); setDragIdx(i);
  }
  function move(from: number, dir: "up" | "down") {
    if (checked) return; const to = dir === "up" ? from - 1 : from + 1; if (to < 0 || to >= items.length) return;
    const n = [...items]; [n[from], n[to]] = [n[to], n[from]]; setItems(n);
  }
  function check() {
    const r = items.map((item, i) => item === config.correctOrder[i]); setResults(r); setChecked(true);
    setTimeout(() => onComplete((r.filter(Boolean).length / items.length) * 100), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      <p className="text-sm text-brand-400 mb-6">{config.instruction || "Remettez dans le bon ordre"}</p>
      <div className="space-y-2 max-w-lg mx-auto">
        {items.map((item, i) => {
          const ok = checked ? results[i] : null;
          return <div key={`${item}-${i}`} draggable={!checked} onDragStart={() => setDragIdx(i)} onDragOver={e => onDragOver(e, i)} onDragEnd={() => setDragIdx(null)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 select-none transition-all ${checked ? ok ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50" : dragIdx === i ? "border-accent-400 bg-accent-50 scale-[1.02] shadow-lg" : "border-brand-200 bg-white hover:border-brand-300 cursor-grab"}`}>
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${checked ? ok ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700" : "bg-brand-100 text-brand-500"}`}>{i + 1}</span>
            <span className="flex-1 font-medium text-brand-800">{item}</span>
            {checked && ok && <span>✅</span>}{checked && !ok && <span>❌</span>}
            {!checked && <div className="flex flex-col gap-0.5"><button onClick={() => move(i, "up")} disabled={i === 0} className="text-slate-500 hover:text-brand-600 disabled:opacity-20 p-1 text-base">▲</button><button onClick={() => move(i, "down")} disabled={i === items.length - 1} className="text-slate-500 hover:text-brand-600 disabled:opacity-20 p-1 text-base">▼</button></div>}
            {!checked && <span className="hidden sm:block text-brand-300">⠿</span>}
          </div>;
        })}
      </div>
      {!checked && <div className="mt-6 text-center"><button onClick={check} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">Vérifier</button></div>}
    </div>
  );
}
