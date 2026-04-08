export const activityTypeLabels: Record<string, { emoji: string; label: string }> = {
  QCM: { emoji: "📝", label: "QCM" },
  TRUE_FALSE: { emoji: "✅", label: "Vrai ou Faux" },
  FILL_BLANKS: { emoji: "✏️", label: "Texte à trous" },
  MATCHING: { emoji: "🔗", label: "Appariement" },
  MEMORY: { emoji: "🃏", label: "Memory" },
  HANGMAN: { emoji: "💀", label: "Pendu" },
  DRAG_DROP: { emoji: "🎯", label: "Glisser-déposer" },
  SORTING: { emoji: "📊", label: "Classement" },
  CATEGORIZE: { emoji: "📂", label: "Catégorisation" },
  WORD_ORDER: { emoji: "🔤", label: "Remettre dans l'ordre" },
};

export const levelColors: Record<string, string> = {
  A1: "bg-green-100 text-green-700",
  A2: "bg-teal-100 text-teal-700",
  B1: "bg-blue-100 text-blue-700",
  B2: "bg-indigo-100 text-indigo-700",
  C1: "bg-purple-100 text-purple-700",
  C2: "bg-pink-100 text-pink-700",
};

export function scoreToStars(score: number): number {
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  if (score >= 20) return 1;
  return 0;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? m + "min " + s + "s" : s + "s";
}
