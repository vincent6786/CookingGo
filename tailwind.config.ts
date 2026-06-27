import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Ready room" palette — disciplined, warm, not the cream/serif/terracotta default
        ink: {
          DEFAULT: "#102A2C", // deep teal-ink, primary text & nav
          soft: "#2C4A4C",
          faint: "#6A8385",
        },
        surface: {
          DEFAULT: "#F7F5EF", // warm paper, used as a utility surface (paired with teal, not serif)
          raised: "#FFFFFF",
          sunk: "#EFEBE1",
        },
        amber: {
          DEFAULT: "#E2922B", // action + training-day flight-ops marker
          soft: "#F6E3C2",
          ink: "#7A4D10",
        },
        moss: {
          DEFAULT: "#2F8F66", // ready / done / in-pantry
          soft: "#D6EADD",
          ink: "#16523A",
        },
        coral: {
          DEFAULT: "#CF5740", // alerts / expiring / missing
          soft: "#F6D9D1",
          ink: "#7A2B1C",
        },
        line: "#DDD6C7",
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
        card: "0 1px 2px rgba(16,42,44,0.06), 0 8px 24px -16px rgba(16,42,44,0.25)",
        nav: "0 -1px 0 rgba(16,42,44,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
