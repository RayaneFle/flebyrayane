"use client";
import { sanitizeLessonHtml } from "@/lib/sanitize";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import DOMPurify from "isomorphic-dompurify";
import ActivityPlayer from "@/components/activities/ActivityPlayer";
import { activityTypeLabels } from "@/lib/utils";

interface Block {
  id: string; position: number; type: string; content: string | null;
  activityId: string | null; requireScore: boolean; minScore: number;
  activity: { id: string; title: string; type: string; config: any; level: string | null } | null;
}

interface Props {
  blocks: Block[];
  lessonId: string;
  nextLessonUrl?: string;
  courseUrl?: string;
}

export default function LessonContent({ blocks, lessonId, nextLessonUrl, courseUrl }: Props) {
  const { data: session } = useSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [lessonDone, setLessonDone] = useState(false);
  const blockRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Mark lesson as in_progress when opened
  useEffect(() => {
    if (session?.user && lessonId) {
      fetch("/api/lessons/" + lessonId + "/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      }).catch(() => {});
    }
  }, [session, lessonId]);

  // Check if all required activities are done
  const checkCompletion = useCallback(() => {
    const activityBlocks = blocks.filter(b => b.type === "activity" && b.activity);
    if (activityBlocks.length === 0) return;
    const allDone = activityBlocks.every(b => completed.has(b.activity!.id));
    if (allDone && !lessonDone) {
      setLessonDone(true);
      if (session?.user && lessonId) {
        fetch("/api/lessons/" + lessonId + "/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }).catch(() => {});
      }
    }
  }, [blocks, completed, lessonDone, session, lessonId]);

  useEffect(() => { checkCompletion(); }, [checkCompletion]);

  function onComplete(blockId: string, activityId: string, score: number) {
    const ns = new Map(scores); ns.set(activityId, score); setScores(ns);
    const block = blocks.find(b => b.id === blockId);
    if (block && (!block.requireScore || score >= block.minScore)) {
      const nc = new Set(completed); nc.add(activityId); setCompleted(nc);
    }
  }

  function isAccessible(idx: number): boolean {
    for (let i = 0; i < idx; i++) {
      const b = blocks[i];
      if (b.type === "activity" && b.activity && !completed.has(b.activity.id)) return false;
    }
    return true;
  }

  function scrollToBlock(idx: number) {
    const el = blockRefs.current.get(idx);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function findNextBlock(currentIdx: number): number {
    for (let i = currentIdx + 1; i < blocks.length; i++) {
      if (isAccessible(i)) return i;
    }
    return -1;
  }

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        const accessible = isAccessible(idx);

        if (block.type === "text" && block.content) {
          return (
            <div key={block.id} ref={el => { if (el) blockRefs.current.set(idx, el); }}
              className={"bg-white rounded-2xl border border-brand-100 p-6 sm:p-8 transition-opacity " + (!accessible ? "opacity-40 pointer-events-none" : "")}>
              <div className="lesson-content" dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(block.content) }} />
            </div>
          );
        }

        if (block.type === "activity" && block.activity) {
          const t = activityTypeLabels[block.activity.type] || { emoji: "?", label: block.activity.type };
          const done = completed.has(block.activity.id);
          const needsHigher = block.requireScore && scores.has(block.activity.id) && (scores.get(block.activity.id) || 0) < block.minScore;
          const nextIdx = findNextBlock(idx);

          return (
            <div key={block.id} ref={el => { if (el) blockRefs.current.set(idx, el); }}
              className={"rounded-2xl border-2 overflow-hidden transition-all " + (!accessible ? "border-slate-200 opacity-40" : done ? "border-green-300 bg-green-50/30" : "border-brand-200 bg-brand-50/20")}>
              <div className="px-6 py-3 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.emoji}</span>
                  <div>
                    <p className="font-heading font-bold text-sm text-slate-800">{block.activity.title}</p>
                    <p className="text-xs text-slate-400">{t.label}</p>
                  </div>
                </div>
                {done && <span className="text-green-600 text-sm font-semibold">{"\u2705"} Valide</span>}
                {block.requireScore && !done && <span className="text-xs text-brand-600 bg-brand-100 px-2 py-1 rounded-lg font-medium">Min: {block.minScore}%</span>}
              </div>
              <div className="p-4 sm:p-6">
                {!accessible ? (
                  <div className="text-center py-8">
                    <span className="text-3xl">{"\ud83d\udd12"}</span>
                    <p className="text-slate-400 mt-2 text-sm">Complétez l’exercice précédent.</p>
                  </div>
                ) : needsHigher ? (
                  <div className="text-center py-4 mb-4">
                    <p className="text-amber-600 text-sm font-medium">Score: {Math.round(scores.get(block.activity.id) || 0)}% - Min: {block.minScore}%</p>
                    <p className="text-slate-400 text-xs mt-1">Réessayez pour atteindre le minimum.</p>
                  </div>
                ) : null}
                {accessible && (
                  <ActivityPlayer
                    activityId={block.activity.id}
                    type={block.activity.type}
                    config={block.activity.config}
                    embedded
                    onEmbeddedComplete={(score) => onComplete(block.id, block.activity!.id, score)}
                  />
                )}
                {accessible && done && nextIdx >= 0 && (
                  <div className="mt-4 text-center">
                    <button onClick={() => scrollToBlock(nextIdx)} className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all text-sm">
                      Partie suivante {"\u2192"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        }
        return null;
      })}

      {lessonDone && (
        <div className="bg-green-50 rounded-2xl border-2 border-green-300 p-8 text-center">
          <span className="text-5xl">{"\ud83c\udf89"}</span>
          <h2 className="font-heading text-2xl font-bold text-green-800 mt-4">Leçon terminée !</h2>
          <p className="text-green-600 mt-2">Vous avez complété toutes les activités.</p>
          <div className="mt-4 space-y-2">
            {Array.from(scores.entries()).map(([actId, score]) => {
              const block = blocks.find(b => b.activity?.id === actId);
              return block ? (
                <div key={actId} className="flex items-center justify-between px-4 py-2 bg-white rounded-lg max-w-md mx-auto">
                  <span className="text-sm text-slate-700">{block.activity?.title}</span>
                  <span className={"text-sm font-bold " + (score >= 60 ? "text-green-600" : "text-amber-500")}>{Math.round(score)}%</span>
                </div>
              ) : null;
            })}
          </div>
          <div className="mt-6 flex justify-center gap-3">
            {nextLessonUrl ? (
              <a href={nextLessonUrl} className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">
                Leçon suivante {"\u2192"}
              </a>
            ) : courseUrl ? (
              <a href={courseUrl} className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-glow transition-all">
                {"\u2705"} Retour au cours
              </a>
            ) : null}
          </div>
        </div>
      )}

      {blocks.length === 0 && (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center">
          <span className="text-4xl">{"\ud83d\udcdd"}</span>
          <p className="text-slate-400 mt-4">Pas encore de contenu.</p>
        </div>
      )}
    </div>
  );
}