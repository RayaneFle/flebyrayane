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

export const levelLabels: Record<string, string> = {
  A1: "Débutant", A2: "Élémentaire", B1: "Intermédiaire", B2: "Avancé", C1: "Autonome", C2: "Maîtrise",
};

export const levelEmoji: Record<string, string> = {
  A1: "🌱", A2: "🌿", B1: "🌳", B2: "🏔️", C1: "⭐", C2: "👑",
};

export function slugify(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function generateClassCode(): string {
  const { randomInt } = require("crypto");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[randomInt(0, chars.length)];
  return code;
}

export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return "https://www.youtube.com/embed/" + m[1];
  }
  return null;
}
