export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

export const levelColors: Record<string, string> = { A1: "level-A1", A2: "level-A2", B1: "level-B1", B2: "level-B2", C1: "level-C1", C2: "level-C2" };
export const levelLabels: Record<string, string> = { A1: "A1 — Découverte", A2: "A2 — Survie", B1: "B1 — Seuil", B2: "B2 — Avancé", C1: "C1 — Autonome", C2: "C2 — Maîtrise" };
export const levelEmoji: Record<string, string> = { A1: "🌱", A2: "🌿", B1: "🌳", B2: "🏔️", C1: "🚀", C2: "👑" };

export const activityTypeLabels: Record<string, { label: string; emoji: string }> = {
  QCM: { label: "QCM", emoji: "📝" }, DRAG_DROP: { label: "Glisser-déposer", emoji: "🎯" },
  MATCHING: { label: "Appariement", emoji: "🔗" }, FILL_BLANKS: { label: "Texte à trous", emoji: "✏️" },
  MEMORY: { label: "Memory", emoji: "🃏" }, HANGMAN: { label: "Pendu", emoji: "💀" },
  SORTING: { label: "Classement", emoji: "📊" }, TRUE_FALSE: { label: "Vrai ou Faux", emoji: "✅" },
  CATEGORIZE: { label: "Catégorisation", emoji: "📂" },
};

export function slugify(t: string): string {
  return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
export function formatTime(s: number): string { const m = Math.floor(s / 60); const sec = s % 60; return m > 0 ? `${m}min ${sec}s` : `${sec}s`; }
export function scoreToStars(s: number): number { if (s >= 90) return 3; if (s >= 60) return 2; if (s >= 30) return 1; return 0; }
export function generateClassCode(): string {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let code = "";
  for (let i = 0; i < 6; i++) code += c.charAt(Math.floor(Math.random() * c.length));
  return code;
}
