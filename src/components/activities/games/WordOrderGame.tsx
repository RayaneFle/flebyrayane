"use client";
import { useState } from "react";
import type { AnswerDetail } from "../ActivityPlayer";

export default function WordOrderGame({ config, onComplete }: { config: any; onComplete: (s: number, details?: AnswerDetail[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>(() => shuffleWords(config.sentences[0].text));
  const [results, setResults] = useState<{sentence: string; userAnswer: string; correct: boolean}[]>([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const sentence = config.sentences[idx];
  const isLast = idx === config.sentences.length - 1;

  function shuffleWords(text: string): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // Make sure it's not in the same order
    if (shuffled.join(" ") === words.join(" ") && words.length > 1) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    return shuffled;
  }

  function selectWord(word: string, index: number) {
    if (checked) return;
    const newAvail = [...available];
    newAvail.splice(index, 1);
    setAvailable(newAvail);
    setSelected([...selected, word]);
  }

  function removeWord(word: string, index: number) {
    if (checked) return;
    const newSel = [...selected];
    newSel.splice(index, 1);
    setSelected(newSel);
    setAvailable([...available, word]);
  }

  function check() {
    const correctWords = sentence.text.split(/\s+/).filter(Boolean);
    const correct = selected.join(" ") === correctWords.join(" ");
    setChecked(true);
    setIsCorrect(correct);
    const newResults = [...results, { sentence: sentence.text, userAnswer: selected.join(" "), correct }];
    setResults(newResults);

    if (isLast) {
      setTimeout(() => {
        const details: AnswerDetail[] = newResults.map(r => ({
          question: "Remettre dans l’ordre",
          userAnswer: r.userAnswer,
          correctAnswer: r.sentence,
          isCorrect: r.correct,
        }));
        const score = (newResults.filter(r => r.correct).length / config.sentences.length) * 100;
        onComplete(score, details);
      }, 1500);
    }
  }

  function next() {
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    setSelected([]);
    setAvailable(shuffleWords(config.sentences[nextIdx].text));
    setChecked(false);
    setIsCorrect(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-brand-100 overflow-hidden">
      <div className="h-1.5 bg-brand-50">
        <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 transition-all duration-500 rounded-full" style={{ width: ((idx + (checked ? 1 : 0)) / config.sentences.length * 100) + "%" }} />
      </div>
      <div className="p-6 sm:p-8">
        <p className="text-xs text-brand-400 mb-2 font-medium">Phrase {idx + 1}/{config.sentences.length}</p>
        {sentence.hint && <p className="text-sm text-slate-500 mb-4 italic">{"\ud83d\udca1"} {sentence.hint}</p>}

        <div className="min-h-[60px] p-4 mb-6 bg-brand-50 rounded-xl border-2 border-dashed border-brand-200 flex flex-wrap gap-2">
          {selected.length === 0 && <p className="text-sm text-brand-300 m-auto">Cliquez sur les mots ci-dessous</p>}
          {selected.map((word, i) => (
            <button key={i} type="button" onClick={() => removeWord(word, i)} disabled={checked}
              className={"px-3 py-2 rounded-lg font-medium text-sm transition-all " + (checked ? isCorrect ? "bg-green-100 text-green-700 border border-green-300" : "bg-red-100 text-red-700 border border-red-300" : "bg-brand-200 text-brand-800 hover:bg-brand-300 cursor-pointer")}>
              {word}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {available.map((word, i) => (
            <button key={i} type="button" onClick={() => selectWord(word, i)} disabled={checked}
              className="px-3 py-2 rounded-lg font-medium text-sm bg-white text-slate-700 border-2 border-slate-200 hover:border-brand-300 hover:bg-brand-50 cursor-pointer transition-all">
              {word}
            </button>
          ))}
        </div>

        {checked && (
          <div className={"p-4 rounded-xl mb-4 " + (isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")}>
            <p className={"text-sm font-medium " + (isCorrect ? "text-green-700" : "text-red-700")}>
              {isCorrect ? "\u2705 Correct !" : "\u274c Incorrect"}
            </p>
            {!isCorrect && <p className="text-sm text-green-700 mt-1">{"\u2192"} {sentence.text}</p>}
          </div>
        )}

        {!checked && selected.length > 0 && (
          <div className="text-center">
            <button type="button" onClick={check} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">Vérifier</button>
          </div>
        )}

        {checked && !isLast && (
          <div className="text-center">
            <button type="button" onClick={next} className="px-8 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">Phrase suivante</button>
          </div>
        )}
      </div>
    </div>
  );
}