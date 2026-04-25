"use client";
import { useState, useMemo } from "react";
import type { AnswerDetail } from "../ActivityPlayer";

export default function FillBlanksGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: AnswerDetail[]) => void }) {
  const segments = useMemo(() => {
    const parts: any[] = []; let bi = 0; const re = /\{\{(.+?)\}\}/g; let last = 0; let m;
    while ((m = re.exec(config.text)) !== null) {
      if (m.index > last) parts.push({ type: "text", value: config.text.slice(last, m.index), index: -1 });
      parts.push({ type: "blank", value: m[1], index: bi }); bi++; last = re.lastIndex;
    }
    if (last < config.text.length) parts.push({ type: "text", value: config.text.slice(last), index: -1 });
    return parts;
  }, [config.text]);

  const blanks = segments.filter(s => s.type === "blank");
  const [answers, setAnswers] = useState<string[]>(blanks.map(() => ""));
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<boolean[]>([]);

  function norm(s: string) { return s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function check() {
    const r = blanks.map((b, i) => norm(answers[i]) === norm(b.value));
    setResults(r); setChecked(true);
    const details: AnswerDetail[] = blanks.map((b, i) => ({
      question: "Trou : ___",
      userAnswer: answers[i] || "(vide)",
      correctAnswer: b.value,
      isCorrect: r[i],
    }));
    onComplete((r.filter(Boolean).length / blanks.length) * 100, details);
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      <p className="text-sm text-brand-400 mb-6">{blanks.length} trou{blanks.length !== 1 ? "s" : ""} à compléter</p>
      <div className="text-lg leading-loose text-slate-800">
        {segments.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.value}</span>;
          const ri = seg.index;
          return <input key={i} value={answers[ri]} onChange={e => { const a = [...answers]; a[ri] = e.target.value; setAnswers(a); }} disabled={checked}
            className={"inline-block w-32 border-b-2 text-center mx-1 outline-none font-medium " + (checked ? results[ri] ? "border-green-500 text-green-700 bg-green-50" : "border-red-500 text-red-700 bg-red-50" : "border-brand-300 focus:border-brand-500")} />;
        })}
      </div>
      {checked && <div className="mt-4 space-y-1">{blanks.map((b, i) => !results[i] && <p key={i} className="text-sm text-red-600">{"\u274c"} {answers[i] || "(vide)"} {"\u2192"} <span className="text-green-700 font-medium">{b.value}</span></p>)}</div>}
      {!checked && <div className="mt-6 text-center"><button onClick={check} disabled={answers.some(a => !a.trim())} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-40 transition-all">Vérifier</button></div>}
    </div>
  );
}