import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff", 100: "#ebeeff", 200: "#d9dffc", 300: "#b4bef9",
          400: "#8b99f5", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca",
          800: "#3730a3", 900: "#312e81",
        },
        accent: {
          50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe",
          400: "#c084fc", 500: "#a855f7", 600: "#9333ea", 700: "#7e22ce",
        },
        surface: { 50: "#fafafe", 100: "#f5f5ff", 200: "#eeeffa" },
        slate: {
          50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1",
          400: "#94a3b8", 500: "#64748b", 600: "#475569", 700: "#334155",
          800: "#1e293b", 900: "#0f172a",
        },
      },
      fontFamily: {
        heading: ["'Outfit'", "system-ui", "sans-serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(13, 148, 136, 0.06)",
        "card-hover": "0 12px 40px rgba(13, 148, 136, 0.12)",
        glow: "0 0 20px rgba(16, 185, 129, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;
