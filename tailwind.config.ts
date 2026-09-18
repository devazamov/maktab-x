import type { Config } from "tailwindcss";

// Color tokens straight from the MAKTAB X visual-style brief (section 5):
// white/sky background, blue primary, sky-blue secondary, purple accent,
// green/orange/red for success/warning/danger.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFF",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#2563EB",
          50: "#EFF4FF",
          100: "#DBE6FE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#38BDF8",
          50: "#F0F9FF",
          500: "#38BDF8",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          50: "#F5F3FF",
          500: "#8B5CF6",
        },
        success: { DEFAULT: "#22C55E", 50: "#F0FDF4" },
        warning: { DEFAULT: "#F97316", 50: "#FFF7ED" },
        danger: { DEFAULT: "#EF4444", 50: "#FEF2F2" },
        surface: "#FFFFFF",
        muted: "#64748B",
        border: "#E5EAF5",
      },
      fontFamily: {
        display: ["var(--font-baloo)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 8px 24px -8px rgba(37, 99, 235, 0.16)",
        card: "0 4px 16px -4px rgba(15, 23, 42, 0.08)",
      },
      keyframes: {
        "xp-fill": {
          from: { width: "0%" },
          to: { width: "var(--xp-target, 0%)" },
        },
        "pop": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "60%": { transform: "scale(1.03)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "xp-fill": "xp-fill 0.8s ease-out forwards",
        pop: "pop 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
