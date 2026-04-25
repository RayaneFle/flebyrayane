"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import QCMGame from "./games/QCMGame";
import TrueFalseGame from "./games/TrueFalseGame";
import MemoryGame from "./games/MemoryGame";
import FillBlanksGame from "./games/FillBlanksGame";
import MatchingGame from "./games/MatchingGame";
import HangmanGame from "./games/HangmanGame";
import DragDropGame from "./games/DragDropGame";
import SortingGame from "./games/SortingGame";
import CategorizeGame from "./games/CategorizeGame";
import WordOrderGame from "./games/WordOrderGame";
import { scoreToStars, formatTime } from "@/lib/utils";

export interface AnswerDetail {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  imageUrl?: string;
}

interface Props {
  activityId: string;
  type: string;
  config: any;
  embedded?: boolean;
  onEmbeddedComplete?: (score: number) => void;
}

export default function ActivityPlayer({ activityId, type, config, embedded, onEmbeddedComplete }: Props) {
  const { data: session } = useSession();
  const [state, setState] = useState<"playing" | "finished">("playing");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [start] = useState(Date.now());
  const [details, setDetails] = useState<AnswerDetail[]>([]);

  useEffect(() => {
    if (state !== "playing") return;
    const i = setInterval(() => setTime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(i);
  }, [state, start]);

  const onComplete = useCallback(async (s: number, answerDetails?: AnswerDetail[]) => {
    const t = Math.floor((Date.now() - start) / 1000);
    setScore(s);
    setTime(t);
    setDetails(answerDetails || []);
    setState("finished");
    if (session?.user) {
      try {
        const url = "/api/activities/" + activityId + "/results";
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: s, timeSpent: t, completed: true }),
        });
      } catch {}
    }
    if (embedded && onEmbeddedComplete) onEmbeddedComplete(s);
  }, [activityId, session, start, embedded, onEmbeddedComplete]);

  function restart() {
    setScore(0);
    setTime(0);
    setDetails([]);
    setState("playing");
  }

  if (state === "finished") {
    const stars = scoreToStars(score);
    const correct = details.filter(d => d.isCorrect).length;
    const total = details.length;

    return (
      <div className="bg-white rounded-2xl border border-brand-100 p-6 sm:p-8 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{stars === 3 ? "\ud83c\udfc6" : stars === 2 ? "\u2b50" : stars === 1 ? "\ud83d\udc4d" : "\ud83d\udcaa"}</div>
          <h2 className="font-heading text-2xl font-bold text-slate-900 mb-1">{stars >= 2 ? "Bravo !" : "Continuez !"}</h2>
          <div className="flex justify-center gap-1 mb-4">{[1, 2, 3].map(i => <span key={i} className={"text-3xl " + (i <= stars ? "star-earned" : "star-empty")}>{"\u2605"}</span>)}</div>
          <div className="flex justify-center gap-8 mb-2">
            <div><p className="text-3xl font-bold text-brand-600">{Math.round(score)}%</p><p className="text-xs text-slate-400">Score</p></div>
            <div><p className="text-3xl font-bold text-brand-600">{formatTime(time)}</p><p className="text-xs text-slate-400">Temps</p></div>
            {total > 0 && <div><p className="text-3xl font-bold text-green-600">{correct}/{total}</p><p className="text-xs text-slate-400">Correct</p></div>}
          </div>
        </div>

        {details.length > 0 && (
          <div className="mb-6">
            <h3 className="font-heading font-bold text-slate-800 mb-3 text-sm">Détail des réponses :</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {details.map((d, i) => (
                <div key={i} className={"p-3 rounded-xl border " + (d.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0">{d.isCorrect ? "\u2705" : "\u274c"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{d.question}</p>
                      {d.imageUrl && <img src={d.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover mt-1" />}
                      {!d.isCorrect && (
                        <div className="mt-1">
                          <p className="text-xs text-red-600">Votre réponse : <span className="font-medium">{d.userAnswer || "(vide)"}</span></p>
                          <p className="text-xs text-green-700">Bonne réponse : <span className="font-medium">{d.correctAnswer}</span></p>
                        </div>
                      )}
                      {d.isCorrect && <p className="text-xs text-green-700 mt-1">Votre réponse : <span className="font-medium">{d.userAnswer}</span></p>}
                      {d.explanation && <p className="text-xs text-slate-500 mt-1 italic">{"\ud83d\udca1"} {d.explanation}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!session && !embedded && <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl mb-4">{"\ud83d\udca1"} Connectez-vous pour sauvegarder !</p>}

        <div className="flex justify-center gap-3">
          <button onClick={restart} className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">{"\ud83d\udd04"} Recommencer</button>
          {!embedded && <a href="/activites" className="px-5 py-2.5 bg-brand-50 text-brand-600 font-semibold rounded-xl hover:bg-brand-100 transition-colors">{"\u2190"} Catalogue</a>}
        </div>
      </div>
    );
  }

  const games: Record<string, React.ReactNode> = {
    QCM: <QCMGame config={config} onComplete={onComplete} />,
    TRUE_FALSE: <TrueFalseGame config={config} onComplete={onComplete} />,
    MEMORY: <MemoryGame config={config} onComplete={onComplete} />,
    FILL_BLANKS: <FillBlanksGame config={config} onComplete={onComplete} />,
    MATCHING: <MatchingGame config={config} onComplete={onComplete} />,
    HANGMAN: <HangmanGame config={config} onComplete={onComplete} />,
    DRAG_DROP: <DragDropGame config={config} onComplete={onComplete} />,
    SORTING: <SortingGame config={config} onComplete={onComplete} />,
    CATEGORIZE: <CategorizeGame config={config} onComplete={onComplete} />,
    WORD_ORDER: <WordOrderGame config={config} onComplete={onComplete} />,
  };

  return (
    <div key={state}>
      {!embedded && <div className="flex justify-end mb-3"><span className="text-xs text-brand-400 bg-brand-50 px-3 py-1 rounded-full">{"\u23f1"} {formatTime(time)}</span></div>}
      {games[type] || <div className="text-center py-12 bg-white rounded-2xl border border-brand-100"><span className="text-4xl">{"\ud83d\udea7"}</span><p className="text-brand-400 mt-4">Type {type} bientôt disponible !</p></div>}
    </div>
  );
}