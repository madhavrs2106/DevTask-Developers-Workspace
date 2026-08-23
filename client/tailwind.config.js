/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /* ── Midnight Neon design tokens ─────────────────────────────── */
      colors: {
        midnight: "#0F172A", // page background
        surface: {
          DEFAULT: "#121212", // cards
          raised: "#181818", // elevated elements (inputs, kanban cards)
          overlay: "#0D0D0D",
        },
        neon: {
          cyan: "#06B6D4",
          teal: "#14B8A6",
        },
        /* User-configurable accent (set via CSS vars from user.avatarColor) */
        accent: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          bright: "rgb(var(--accent-bright-rgb) / <alpha-value>)",
          soft: "rgb(var(--accent-soft-rgb) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "#F8FAFC", // headings / key metrics
          muted: "#94A3B8", // secondary text
          faint: "#64748B",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.5), 0 8px 32px rgba(2,6,23,.45)",
        "glow-sm": "0 0 12px rgb(var(--accent-rgb) / .22)",
        glow: "0 0 24px rgb(var(--accent-rgb) / .28)",
        "glow-lg": "0 0 48px rgb(var(--accent-rgb) / .35)",
      },
      backgroundImage: {
        "neon-gradient":
          "linear-gradient(135deg, rgb(var(--accent-rgb)) 0%, rgb(var(--accent-2-rgb)) 100%)",
        "neon-gradient-soft":
          "linear-gradient(135deg, rgb(var(--accent-rgb) / .14) 0%, rgb(var(--accent-2-rgb) / .10) 100%)",
        "hero-radial":
          "radial-gradient(60% 50% at 50% 0%, rgb(var(--accent-rgb) / .12) 0%, rgba(15,23,42,0) 70%)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 18px rgb(var(--accent-rgb) / .25)" },
          "50%": { boxShadow: "0 0 34px rgb(var(--accent-rgb) / .55)" },
        },
      },
      animation: {
        "fade-in": "fade-in .3s ease-out both",
        "slide-up": "slide-up .35s cubic-bezier(.21,1.02,.73,1) both",
        "scale-in": "scale-in .18s ease-out both",
        "pulse-glow": "pulse-glow 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
