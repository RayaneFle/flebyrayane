"use client";
import { useState, useMemo } from "react";

export default function FillBlanksGame({ config, onComplete }: { config: any; onComplete: (s: number) => void }) {
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
    const r = blanks.map((b, i) => norm(answers[i]) === norm(b.value)); setResults(r); setChecked(true);
    setTimeout(() => onComplete((r.filter(Boolean).length / blanks.length) * 100), 2000);
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      <p className="text-sm text-brand-400 mb-6">{blanks.length} trou{blanks.length !== 1 ? "s" : ""} à compléter</p>
      <div className="text-lg leading-loose text-brand-800">
        {segments.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.value}</span>;
          const idx = seg.index; const ok = checked ? results[idx] : null;
          return <span key={i} className="inline-block mx-1 align-middle">
            <input type="text" value={answers[idx]} onChange={e => { const a = [...answers]; a[idx] = e.target.value; setAnswers(a); }} disabled={checked}
              className={`border-b-2 px-2 py-1 text-center text-lg font-medium outline-none transition-colors w-32 bg-transparent ${checked ? ok ? "border-green-500 text-green-700" : "border-red-500 text-red-700" : "border-accent-300 focus:border-accent-500"}`} placeholder="…" />
            {checked && !ok && <span className="block text-xs text-green-600 mt-1">→ {seg.value}</span>}
          </span>;
        })}
      </div>
      {!checked && <div className="mt-8 text-center"><button onClick={check} disabled={answers.some(a => !a.trim())} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow disabled:opacity-40 transition-all">Vérifier</button></div>}
    </div>
  );
}
