"use client";
import { useState, useMemo } from "react";

export default function MatchingGame({ config, onComplete }: { config: any; onComplete: (s: number) => void }) {
  const left = useMemo(() => [...config.pairs].sort(() => Math.random() - 0.5), [config.pairs]);
  const right = useMemo(() => [...config.pairs].sort(() => Math.random() - 0.5), [config.pairs]);
  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Map<string, string>>(new Map());
  const [wrong, setWrong] = useState<[string, string] | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  function clickLeft(l: string) { if (done.has(l)) return; setSelLeft(l); setWrong(null); }
  function clickRight(r: string) {
    if (!selLeft || done.has(r)) return;
    if (config.pairs.some((p: any) => p.left === selLeft && p.right === r)) {
      const nm = new Map(matches); nm.set(selLeft, r); setMatches(nm);
      const nd = new Set(done); nd.add(selLeft); nd.add(r); setDone(nd);
      setSelLeft(null); if (nm.size === config.pairs.length) setTimeout(() => onComplete(100), 500);
    } else { setWrong([selLeft, r]); setTimeout(() => { setWrong(null); setSelLeft(null); }, 800); }
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      {config.instruction && <p className="text-sm text-slate-400 mb-2">{config.instruction}</p>}
      <p className="text-xs text-slate-300 mb-6">{matches.size}/{config.pairs.length} paires</p>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">{left.map((p: any) => {
          const d = done.has(p.left); const s = selLeft === p.left; const w = wrong?.[0] === p.left;
          return (<button key={p.left} onClick={() => clickLeft(p.left)} disabled={d} className={`w-full px-4 py-3 rounded-xl text-left font-medium text-sm transition-all flex items-center gap-3 ${d ? "bg-green-50 text-green-700 border-2 border-green-300" : w ? "bg-red-50 text-red-700 border-2 border-red-300" : s ? "bg-brand-50 text-brand-700 border-2 border-brand-400 shadow-md" : "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-brand-300 cursor-pointer"}`}>
            {p.leftImage && <img src={p.leftImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
            <span>{d && "\u2705 "}{p.left}</span>
          </button>);
        })}</div>
        <div className="space-y-2">{right.map((p: any) => {
          const d = done.has(p.right); const w = wrong?.[1] === p.right;
          return (<button key={p.right} onClick={() => clickRight(p.right)} disabled={d || !selLeft} className={`w-full px-4 py-3 rounded-xl text-left font-medium text-sm transition-all flex items-center gap-3 ${d ? "bg-green-50 text-green-700 border-2 border-green-300" : w ? "bg-red-50 text-red-700 border-2 border-red-300" : selLeft && !d ? "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-brand-300 cursor-pointer" : "bg-slate-50/50 text-slate-300 border-2 border-slate-100"}`}>
            {p.rightImage && <img src={p.rightImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
            <span>{d && "\u2705 "}{p.right}</span>
          </button>);
        })}</div>
      </div>
    </div>
  );
}