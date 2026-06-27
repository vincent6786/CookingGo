import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          sunk: "rgb(var(--surface-sunk) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "rgb(var(--amber) / <alpha-value>)",
          soft: "rgb(var(--amber-soft) / <alpha-value>)",
          ink: "rgb(var(--amber-ink) / <alpha-value>)",
        },
        moss: {
          DEFAULT: "rgb(var(--moss) / <alpha-value>)",
          soft: "rgb(var(--moss-soft) / <alpha-value>)",
          ink: "rgb(var(--moss-ink) / <alpha-value>)",
        },
        coral: {
          DEFAULT: "rgb(var(--coral) / <alpha-value>)",
          soft: "rgb(var(--coral-soft) / <alpha-value>)",
          ink: "rgb(var(--coral-ink) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        nav: "var(--shadow-nav)",
      },
    },
  },
  plugins: [],
};

export default config;
