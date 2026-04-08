export const activityTypeLabels: Record<string, { emoji: string; label: string }> = {
  QCM: { emoji: "\ud83d\udcdd", label: "QCM" },
  TRUE_FALSE: { emoji: "\u2705", label: "Vrai ou Faux" },
  FILL_BLANKS: { emoji: "\u270f\ufe0f", label: "Texte a trous" },
  MATCHING: { emoji: "\ud83d\udd17", label: "Appariement" },
  MEMORY: { emoji: "\ud83c\udccf", label: "Memory" },
  HANGMAN: { emoji: "\ud83d\udc80", label: "Pendu" },
  DRAG_DROP: { emoji: "\ud83c\udfaf", label: "Glisser-deposer" },
  SORTING: { emoji: "\ud83d\udcca", label: "Classement" },
  CATEGORIZE: { emoji: "\ud83d\udcc2", label: "Categorisation" },
  WORD_ORDER: { emoji: "\ud83d\udd24", label: "Remettre dans l'ordre" },
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
