"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReorderSectionBtns({ sectionId, isFirst, isLast }: { sectionId: string; isFirst: boolean; isLast: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function move(direction: "up" | "down") {
    if (loading) return;
    setLoading(true);
    const res = await fetch("/api/admin/sections/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, direction }),
    });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={() => move("up")}
        disabled={isFirst || loading}
        className="text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded p-0.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Monter"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
      </button>
      <button
        onClick={() => move("down")}
        disabled={isLast || loading}
        className="text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded p-0.5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Descendre"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
      </button>
    </div>
  );
}
