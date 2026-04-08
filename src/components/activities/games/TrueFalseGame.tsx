"use client";
import { useState } from "react";
import type { AnswerDetail } from "../ActivityPlayer";

export default function TrueFalseGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: AnswerDetail[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [fb, setFb] = useState(false);
  const [ans, setAns] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const q = config.questions[idx];
  const last = idx === config.questions.length - 1;
  const ok = ans === q.isTrue;

  function answer(v: boolean) {
    if (fb) return;
    setAns(v); setFb(true);
    const newAnswers = [...answers, v];
    setAnswers(newAnswers);
    setTimeout(() => {
      if (last) {
        const details: AnswerDetail[] = config.questions.map((q: any, i: number) => ({
          question: q.statement,
          userAnswer: newAnswers[i] ? "Vrai" : "Faux",
          correctAnswer: q.isTrue ? "Vrai" : "Faux",
          isCorrect: newAnswers[i] === q.isTrue,
          explanation: q.explanation || undefined,
          imageUrl: q.imageUrl || undefined,
        }));
        const correct = details.filter(d => d.isCorrect).length;
        onComplete((correct / config.questions.length) * 100, details);
      } else { setIdx(i => i + 1); setFb(false); setAns(null); }
    }, 1200);
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
      <div className="h-1.5 bg-brand-50"><div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500 rounded-full" style={{ width: ((idx + (fb ? 1 : 0)) / config.questions.length * 100) + "%" }} /></div>
      <div className="p-6 sm:p-8 text-center">
        <p className="text-xs text-brand-400 mb-6 font-medium">{idx + 1}/{config.questions.length}</p>
        {q.imageUrl && <img src={q.imageUrl} alt="" className="max-h-48 rounded-xl mb-4 mx-auto" />}
        <h3 className="font-heading text-xl font-bold text-slate-900 mb-8 max-w-lg mx-auto">{q.statement}</h3>
        <div className="flex justify-center gap-6">
          <button onClick={() => answer(true)} disabled={fb} className={"w-32 h-32 rounded-2xl font-bold text-lg transition-all " + (fb && ans === true ? (ok ? "bg-green-500 text-white scale-110" : "bg-red-500 text-white scale-95") : fb ? "bg-slate-50 text-slate-300" : "bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:scale-105 cursor-pointer")}><span className="text-3xl block mb-1">{"\u2705"}</span>VRAI</button>
          <button onClick={() => answer(false)} disabled={fb} className={"w-32 h-32 rounded-2xl font-bold text-lg transition-all " + (fb && ans === false ? (ok ? "bg-green-500 text-white scale-110" : "bg-red-500 text-white scale-95") : fb ? "bg-slate-50 text-slate-300" : "bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 hover:scale-105 cursor-pointer")}><span className="text-3xl block mb-1">{"\u274c"}</span>FAUX</button>
        </div>
        {fb && q.explanation && <div className="mt-6 p-4 bg-accent-50 rounded-xl text-sm text-accent-700 max-w-md mx-auto border border-accent-100">{"\ud83d\udca1"} {q.explanation}</div>}
      </div>
    </div>
  );
}