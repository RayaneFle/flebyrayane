"use client";
import { useState, useMemo } from "react";
import type { AnswerDetail } from "../ActivityPlayer";

export default function MatchingGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: AnswerDetail[]) => void }) {
  // Give each pair a unique ID
  const pairs = useMemo(() => config.pairs.map((p: any, i: number) => ({ ...p, _id: i })), [config.pairs]);
  const leftItems = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs]);
  const rightItems = useMemo(() => [...pairs].sort(() => Math.random() - 0.5), [pairs]);

  const [selLeftId, setSelLeftId] = useState<number | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [wrongPair, setWrongPair] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState(0);

  function leftLabel(p: any) { return p.left || p.leftImage || "?"; }
  function rightLabel(p: any) { return p.right || p.rightImage || "?"; }

  function clickLeft(id: number) {
    if (matchedIds.has(id)) return;
    setSelLeftId(id);
    setWrongPair(null);
  }

  function clickRight(id: number) {
    if (selLeftId === null || matchedIds.has(id)) return;

    if (selLeftId === id) {
      // Correct match - same pair ID
      const nm = new Set(matchedIds);
      nm.add(id);
      setMatchedIds(nm);
      setSelLeftId(null);

      if (nm.size === pairs.length) {
        const details: AnswerDetail[] = pairs.map((p: any) => ({
          question: p.left || "(image)",
          userAnswer: p.right || "(image)",
          correctAnswer: p.right || "(image)",
          isCorrect: true,
          imageUrl: p.leftImage || p.rightImage || undefined,
        }));
        const score = Math.max(0, 100 - errors * (100 / pairs.length / 2));
        setTimeout(() => onComplete(Math.round(score), details), 500);
      }
    } else {
      // Wrong match
      setWrongPair([selLeftId, id]);
      setErrors(e => e + 1);
      setTimeout(() => {
        setWrongPair(null);
        setSelLeftId(null);
      }, 800);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      {config.instruction && <p className="text-sm text-slate-400 mb-2">{config.instruction}</p>}
      <p className="text-xs text-slate-300 mb-6">{matchedIds.size}/{pairs.length} paires</p>
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">{leftItems.map((p: any) => {
          const d = matchedIds.has(p._id);
          const s = selLeftId === p._id;
          const w = wrongPair?.[0] === p._id;
          return (
            <button key={"L" + p._id} onClick={() => clickLeft(p._id)} disabled={d}
              className={"w-full px-3 py-3 rounded-xl text-left font-medium text-sm transition-all flex items-center gap-3 " +
                (d ? "bg-green-50 text-green-700 border-2 border-green-300" :
                w ? "bg-red-50 text-red-700 border-2 border-red-300" :
                s ? "bg-brand-50 text-brand-700 border-2 border-brand-400 shadow-md" :
                "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-brand-300 cursor-pointer")}>
              {p.leftImage && <img src={p.leftImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
              <span>{d ? "\u2705 " : ""}{p.left || ""}</span>
            </button>
          );
        })}</div>
        <div className="space-y-2">{rightItems.map((p: any) => {
          const d = matchedIds.has(p._id);
          const w = wrongPair?.[1] === p._id;
          return (
            <button key={"R" + p._id} onClick={() => clickRight(p._id)} disabled={d || selLeftId === null}
              className={"w-full px-3 py-3 rounded-xl text-left font-medium text-sm transition-all flex items-center gap-3 " +
                (d ? "bg-green-50 text-green-700 border-2 border-green-300" :
                w ? "bg-red-50 text-red-700 border-2 border-red-300" :
                selLeftId !== null && !d ? "bg-slate-50 text-slate-700 border-2 border-slate-200 hover:border-brand-300 cursor-pointer" :
                "bg-slate-50/50 text-slate-300 border-2 border-slate-100")}>
              {p.rightImage && <img src={p.rightImage} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
              <span>{d ? "\u2705 " : ""}{p.right || ""}</span>
            </button>
          );
        })}</div>
      </div>
    </div>
  );
}