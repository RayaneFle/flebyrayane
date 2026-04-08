"use client";
import { useState } from "react";
import type { AnswerDetail } from "../ActivityPlayer";

export default function SortingGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: AnswerDetail[]) => void }) {
  const [items, setItems] = useState(() => [...config.items].sort(() => Math.random() - 0.5));
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function move(from: number, dir: "up" | "down") {
    if (checked) return;
    const to = dir === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= items.length) return;
    const n = [...items]; [n[from], n[to]] = [n[to], n[from]]; setItems(n);
  }

  function check() {
    const r = items.map((item: string, i: number) => item === config.correctOrder[i]);
    setResults(r); setChecked(true);
    const details: AnswerDetail[] = items.map((item: string, i: number) => ({
      question: "Position " + (i + 1),
      userAnswer: item,
      correctAnswer: config.correctOrder[i],
      isCorrect: r[i],
    }));
    onComplete((r.filter(Boolean).length / items.length) * 100, details);
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      <p className="text-sm text-brand-400 mb-6">{config.instruction || "Remettez dans le bon ordre"}</p>
      <div className="space-y-2 max-w-lg mx-auto">
        {items.map((item: string, i: number) => {
          const ok = checked ? results[i] : null;
          return (
            <div key={i} className={"flex items-center gap-3 p-4 rounded-xl border-2 select-none transition-all " + (checked ? ok ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50" : "border-brand-200 bg-white")}>
              <span className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 " + (checked ? ok ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700" : "bg-brand-100 text-brand-600")}>{i + 1}</span>
              <span className="flex-1 font-medium text-slate-700">{item}</span>
              {checked && !ok && <span className="text-xs text-green-600">{"\u2192"} {config.correctOrder[i]}</span>}
              {!checked && <div className="flex flex-col gap-0.5">
                <button onClick={() => move(i, "up")} disabled={i === 0} className="text-slate-500 hover:text-brand-600 disabled:opacity-20 p-1 text-base">{"\u25b2"}</button>
                <button onClick={() => move(i, "down")} disabled={i === items.length - 1} className="text-slate-500 hover:text-brand-600 disabled:opacity-20 p-1 text-base">{"\u25bc"}</button>
              </div>}
            </div>
          );
        })}
      </div>
      {!checked && <div className="mt-6 text-center"><button onClick={check} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">Verifier</button></div>}
    </div>
  );
}