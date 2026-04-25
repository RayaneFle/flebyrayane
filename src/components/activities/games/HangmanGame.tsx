"use client";
import { useState, useMemo } from "react";

const KB = [["A","Z","E","R","T","Y","U","I","O","P"],["Q","S","D","F","G","H","J","K","L","M"],["W","X","C","V","B","N","É","È","Ê","Ç"]];
const MAX = 7;

export default function HangmanGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: any[]) => void }) {
  const [wi, setWi] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [won, setWon] = useState(0);
  const cur = config.words[wi];
  const word = useMemo(() => cur.word.toUpperCase(), [cur.word]);
  const errors = useMemo(() => { let c = 0; guessed.forEach(l => { if (!word.includes(l)) c++; }); return c; }, [guessed, word]);
  const found = useMemo(() => [...word].every(ch => " -'".includes(ch) || guessed.has(ch)), [word, guessed]);
  const lost = errors >= MAX;
  const over = found || lost;
  const isLast = wi === config.words.length - 1;

  function guess(l: string) { if (over || guessed.has(l)) return; setGuessed(p => new Set(p).add(l)); }
  function next() {
    const w = found ? won + 1 : won; setWon(w);
    if (isLast) { const details = config.words.map((wd: any, i: number) => ({ question: wd.hint || "Mot " + (i+1), userAnswer: i < wi ? "Trouvé" : found ? "Trouvé" : "Perdu", correctAnswer: wd.word, isCorrect: i < wi ? true : found, imageUrl: wd.imageUrl })); onComplete((w / config.words.length) * 100, details); } else { setWi(i => i + 1); setGuessed(new Set()); }
  }

  const parts = [
    <line key="1" x1="20" y1="180" x2="100" y2="180" stroke="currentColor" strokeWidth="3"/>,
    <line key="2" x1="60" y1="180" x2="60" y2="20" stroke="currentColor" strokeWidth="3"/>,
    <line key="3" x1="60" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="3"/>,
    <line key="4" x1="140" y1="20" x2="140" y2="50" stroke="currentColor" strokeWidth="3"/>,
    <circle key="5" cx="140" cy="65" r="15" stroke="currentColor" strokeWidth="3" fill="none"/>,
    <line key="6" x1="140" y1="80" x2="140" y2="130" stroke="currentColor" strokeWidth="3"/>,
    <g key="7"><line x1="140" y1="95" x2="115" y2="115" stroke="currentColor" strokeWidth="3"/><line x1="140" y1="95" x2="165" y2="115" stroke="currentColor" strokeWidth="3"/><line x1="140" y1="130" x2="115" y2="160" stroke="currentColor" strokeWidth="3"/><line x1="140" y1="130" x2="165" y2="160" stroke="currentColor" strokeWidth="3"/></g>,
  ];

  return (
    <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6"><p className="text-xs text-brand-400">Mot {wi+1}/{config.words.length}</p><p className="text-xs text-red-500 font-semibold">{errors}/{MAX} erreurs</p></div>
      <div className="flex flex-col items-center gap-6">
        <svg viewBox="0 0 200 200" className="w-36 h-36 text-brand-700">{parts.slice(0, Math.min(errors + 1, parts.length))}</svg>
        {cur.imageUrl && <img src={cur.imageUrl} alt="" className="max-h-32 rounded-xl" />}
        {cur.hint && <p className="text-sm text-accent-600 bg-accent-50 px-4 py-2 rounded-lg border border-accent-100">💡 {cur.hint}</p>}
        <div className="flex gap-2 flex-wrap justify-center">
          {[...word].map((ch, i) => { const sp = " -'".includes(ch); const rev = sp || guessed.has(ch) || over;
            return <span key={i} className={`w-10 h-12 flex items-center justify-center text-xl font-bold border-b-2 ${sp ? "" : over && !guessed.has(ch) ? "border-red-400 text-red-500 bg-red-50 rounded" : rev ? "border-green-400 text-green-700" : "border-brand-300"}`}>{rev ? ch : ""}</span>;
          })}
        </div>
        {over && <div className={`text-center p-4 rounded-xl ${found ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}><p className="font-bold text-lg">{found ? "🎉 Bravo !" : `😞 C’était : ${cur.word}`}</p><button onClick={next} className="mt-3 px-6 py-2 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-lg font-semibold hover:shadow-glow transition-all">{isLast ? "Résultat" : "Suivant →"}</button></div>}
        {!over && <div className="space-y-2">{KB.map((row, ri) => <div key={ri} className="flex gap-1.5 justify-center">{row.map(l => { const used = guessed.has(l); const ok = used && word.includes(l); const bad = used && !word.includes(l); return <button key={l} onClick={() => guess(l)} disabled={used} className={`w-9 h-10 sm:w-10 sm:h-11 rounded-lg font-bold text-sm transition-all ${ok ? "bg-green-500 text-white" : bad ? "bg-brand-200 text-brand-400" : "bg-brand-50 hover:bg-accent-100 hover:text-accent-700 cursor-pointer"}`}>{l}</button>; })}</div>)}</div>}
      </div>
    </div>
  );
}
