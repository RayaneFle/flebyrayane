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
import { scoreToStars, formatTime } from "@/lib/utils";

interface Props { activityId: string; type: string; config: any; embedded?: boolean; onEmbeddedComplete?: (score: number) => void; }

export default function ActivityPlayer({ activityId, type, config, embedded, onEmbeddedComplete }: Props) {
  const { data: session } = useSession();
  const [state, setState] = useState<"playing"|"finished">("playing");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [start] = useState(Date.now());

  useEffect(() => {
    if (state !== "playing") return;
    const i = setInterval(() => setTime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(i);
  }, [state, start]);

  const onComplete = useCallback(async (s: number) => {
    const t = Math.floor((Date.now() - start) / 1000);
    setScore(s); setTime(t); setState("finished");
    if (session?.user) { try { await fetch(`/api/activities/${activityId}/results`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: s, timeSpent: t, completed: true }) }); } catch {} }
    if (embedded && onEmbeddedComplete) onEmbeddedComplete(s);
  }, [activityId, session, start, embedded, onEmbeddedComplete]);

  if (state === "finished") {
    const stars = scoreToStars(score);
    return (
      <div className="bg-white rounded-2xl border border-brand-100 p-8 text-center animate-fade-in-up">
        <div className="text-5xl mb-4">{stars === 3 ? "🏆" : stars === 2 ? "⭐" : stars === 1 ? "👍" : "💪"}</div>
        <h2 className="font-heading text-2xl font-bold text-brand-900 mb-2">{stars >= 2 ? "Bravo !" : "Continuez !"}</h2>
        <div className="flex justify-center gap-1 mb-6">{[1,2,3].map(i => <span key={i} className={`text-3xl ${i <= stars ? "star-earned" : "star-empty"}`}>★</span>)}</div>
        <div className="flex justify-center gap-8 mb-6">
          <div><p className="text-3xl font-bold text-brand-600">{Math.round(score)}%</p><p className="text-sm text-brand-400">Score</p></div>
          <div><p className="text-3xl font-bold text-brand-600">{formatTime(time)}</p><p className="text-sm text-brand-400">Temps</p></div>
        </div>
        {!session && !embedded && <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl mb-6">💡 Connectez-vous pour sauvegarder !</p>}
        <div className="flex justify-center gap-3">
          <button onClick={() => setState("playing")} className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">🔄 Recommencer</button>
          {!embedded && <a href="/activites" className="px-5 py-2.5 bg-brand-50 text-brand-600 font-semibold rounded-xl hover:bg-brand-100 transition-colors">← Catalogue</a>}
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
  };

  return (
    <div key={state}>
      {!embedded && <div className="flex justify-end mb-3"><span className="text-xs text-brand-400 bg-brand-50 px-3 py-1 rounded-full">⏱ {formatTime(time)}</span></div>}
      {games[type] || <div className="text-center py-12 bg-white rounded-2xl border border-brand-100"><span className="text-4xl">🚧</span><p className="text-brand-400 mt-4">Type « {type} » bientôt disponible !</p></div>}
    </div>
  );
}
