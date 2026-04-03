"use client";
import { useState } from "react";
import ActivityPlayer from "@/components/activities/ActivityPlayer";
import { activityTypeLabels } from "@/lib/utils";

interface Block {
  id: string; position: number; type: string; content: string | null;
  activityId: string | null; requireScore: boolean; minScore: number;
  activity: { id: string; title: string; type: string; config: any; level: string | null } | null;
}

export default function LessonContent({ blocks }: { blocks: Block[] }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [scores, setScores] = useState<Map<string, number>>(new Map());

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

  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        const accessible = isAccessible(idx);

        if (block.type === "text" && block.content) {
          return (
            <div key={block.id} className={`bg-white rounded-2xl border border-brand-100 p-6 sm:p-8 transition-opacity ${!accessible ? "opacity-40 pointer-events-none" : ""}`}>
              <div
                className="lesson-content"
                dangerouslySetInnerHTML={{ __html: block.content }}
              />
            </div>
          );
        }

        if (block.type === "activity" && block.activity) {
          const t = activityTypeLabels[block.activity.type] || { emoji: "📝", label: block.activity.type };
          const done = completed.has(block.activity.id);
          const needsHigher = block.requireScore && scores.has(block.activity.id) && (scores.get(block.activity.id) || 0) < block.minScore;

          return (
            <div key={block.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${!accessible ? "border-slate-200 opacity-40" : done ? "border-green-300 bg-green-50/30" : "border-brand-200 bg-brand-50/20"}`}>
              <div className="px-6 py-3 bg-gradient-to-r from-brand-50 to-accent-50 border-b border-brand-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.emoji}</span>
                  <div>
                    <p className="font-heading font-bold text-sm text-slate-800">{block.activity.title}</p>
                    <p className="text-xs text-slate-400">{t.label}</p>
                  </div>
                </div>
                {done && <span className="text-green-600 text-sm font-semibold">✅ Valide</span>}
                {block.requireScore && !done && <span className="text-xs text-brand-600 bg-brand-100 px-2 py-1 rounded-lg font-medium">Min: {block.minScore}%</span>}
              </div>
              <div className="p-4 sm:p-6">
                {!accessible ? (
                  <div className="text-center py-8">
                    <span className="text-3xl">🔒</span>
                    <p className="text-slate-400 mt-2 text-sm">Completez l exercice precedent.</p>
                  </div>
                ) : needsHigher ? (
                  <div className="text-center py-4 mb-4">
                    <p className="text-amber-600 text-sm font-medium">Score: {Math.round(scores.get(block.activity.id) || 0)}% — Min: {block.minScore}%</p>
                    <p className="text-slate-400 text-xs mt-1">Reessayez pour atteindre le minimum.</p>
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
              </div>
            </div>
          );
        }
        return null;
      })}

      {blocks.length === 0 && (
        <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center">
          <span className="text-4xl">📝</span>
          <p className="text-slate-400 mt-4">Pas encore de contenu.</p>
        </div>
      )}
    </div>
  );
}
