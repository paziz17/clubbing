import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // CLUBBING brand palette — deep black + warm gold
        bg: {
          DEFAULT: "#06060A",
          soft: "#0B0B12",
          card: "#10101A",
          elevated: "#15151F",
        },
        gold: {
          DEFAULT: "#D4AF37",
          warm: "#E6BE5A",
          deep: "#B8941F",
          glow: "#F4D67A",
        },
        ink: {
          DEFAULT: "#F5F1E6",
          muted: "#9A9387",
          dim: "#5E5A4F",
        },
        line: "#23232F",
        success: "#22C55E",
        danger: "#EF4444",
        warn: "#F59E0B",
        info: "#3B82F6",
        tier: {
          regular: "#9A9387",
          silver: "#C0C0C0",
          gold: "#D4AF37",
          platinum: "#7DD3FC",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Cinzel", "Playfair Display", "serif"],
        "display-he": ["var(--font-display-he)", "Frank Ruhl Libre", "Cinzel", "serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #F4D67A 0%, #D4AF37 50%, #B8941F 100%)",
        "gold-shimmer":
          "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)",
        "noise":
          "radial-gradient(rgba(212,175,55,0.05) 1px, transparent 1px)",
      },
      boxShadow: {
        gold: "0 0 40px rgba(212,175,55,0.15)",
        "gold-strong": "0 0 60px rgba(212,175,55,0.35)",
        card: "0 4px 20px rgba(0,0,0,0.4)",
      },
      keyframes: {
        "pulse-gold": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212,175,55,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(212,175,55,0.6)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "swipe-hint": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "pulse-gold": "pulse-gold 2s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "fade-up": "fade-up 0.4s ease-out",
        "swipe-hint": "swipe-hint 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
