"use client";
import { useState } from "react";
import type { AnswerDetail } from "../ActivityPlayer";

export default function QCMGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: AnswerDetail[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [fb, setFb] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const q = config.questions[idx];
  const last = idx === config.questions.length - 1;
  const progress = ((idx + (fb ? 1 : 0)) / config.questions.length) * 100;

  function pick(i: number) {
    if (fb) return;
    setSel(i);
    setFb(true);
    const newAnswers = [...answers, i];
    setAnswers(newAnswers);

    if (last) {
      // Build details and finish
      setTimeout(() => {
        const details: AnswerDetail[] = config.questions.map((q: any, qi: number) => {
          const ans = qi < newAnswers.length ? newAnswers[qi] : -1;
          const optText = (o: any) => typeof o === "string" ? o : o.text || "";
          return {
            question: q.question,
            userAnswer: ans >= 0 ? optText(q.options[ans]) : "(non repondu)",
            correctAnswer: optText(q.options[q.correctIndex]),
            isCorrect: ans === q.correctIndex,
            explanation: q.explanation || undefined,
            imageUrl: q.imageUrl || undefined,
          };
        });
        const correct = details.filter(d => d.isCorrect).length;
        onComplete((correct / config.questions.length) * 100, details);
      }, 1200);
    } else {
      setTimeout(() => {
        setIdx(p => p + 1);
        setSel(null);
        setFb(false);
      }, 1200);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
      <div className="h-1.5 bg-brand-50"><div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500 rounded-full" style={{ width: progress + "%" }} /></div>
      <div className="p-6 sm:p-8">
        <p className="text-xs text-brand-400 mb-2 font-medium">Question {idx + 1}/{config.questions.length}</p>
        {q.imageUrl && <img src={q.imageUrl} alt="" className="max-h-48 rounded-xl mb-4 mx-auto" />}
        <h3 className="font-heading text-xl font-bold text-slate-900 mb-6">{q.question}</h3>
        <div className="space-y-3">
          {q.options.map((opt: any, i: number) => {
            const isStr = typeof opt === "string";
            const text = isStr ? opt : opt.text;
            const img = isStr ? null : opt.imageUrl;
            let cls = "w-full text-left px-5 py-3.5 rounded-xl border-2 font-medium transition-all text-sm ";
            if (!fb) cls += "border-brand-200 hover:border-accent-300 hover:bg-accent-50/50 cursor-pointer";
            else if (i === q.correctIndex) cls += "border-green-400 bg-green-50 text-green-700";
            else if (i === sel) cls += "border-red-400 bg-red-50 text-red-700";
            else cls += "border-slate-100 text-slate-300";
            return (
              <button key={i} onClick={() => pick(i)} disabled={fb} className={cls}>
                <span className="inline-flex items-center gap-3">
                  <span className={"w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 " + (fb && i === q.correctIndex ? "bg-green-200 text-green-700" : fb && i === sel ? "bg-red-200 text-red-700" : "bg-brand-100 text-brand-500")}>{String.fromCharCode(65 + i)}</span>
                  <span>{img && <img src={img} alt="" className="h-12 rounded inline mr-2" />}{text}</span>
                </span>
              </button>
            );
          })}
        </div>
        {fb && q.explanation && <div className="mt-4 p-4 bg-accent-50 rounded-xl text-sm text-accent-700 border border-accent-100">{"\ud83d\udca1"} {q.explanation}</div>}
      </div>
    </div>
  );
}