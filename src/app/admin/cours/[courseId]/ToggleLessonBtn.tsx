"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ToggleLessonBtn({ lessonId, hidden: initialHidden }: { lessonId: string; hidden: boolean }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initialHidden);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    setHidden(!hidden);
    await fetch("/api/lessons/" + lessonId + "/visibility", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !hidden }),
    });
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={"text-xs px-2 py-1 rounded-lg font-medium transition-all " + (hidden ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100")}>
      {loading ? "..." : hidden ? "Masquée" : "Visible"}
    </button>
  );
}