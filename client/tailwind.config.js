/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx,js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#070A12",
          900: "#0B0F1A",
          800: "#11172A",
          700: "#171F36",
          600: "#1F2942",
          500: "#2A3553",
          400: "#3B4870",
        },
        accent: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        warn: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
        },
      },
      boxShadow: {
        "card": "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
        "ring-accent": "0 0 0 1px rgba(16,185,129,0.4), 0 8px 30px -10px rgba(16,185,129,0.35)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at top, rgba(56,189,248,0.08), transparent 60%), radial-gradient(circle at bottom right, rgba(16,185,129,0.07), transparent 50%)",
      },
    },
  },
  plugins: [],
};
