/** @type {import('tailwindcss').Config} */
// Palette mirrors `microfrontends/_design_system/vue_v3/src/foundation/colors.tokens.scss`.
// Tailwind's default `slate` palette already matches the design system's
// `neutral` map exactly, so we lean on `slate-*` for body text + neutral
// surfaces and only add explicit tokens for the brand / semantic palettes.
export default {
  content: ["./index.html", "./src/**/*.{vue,ts,tsx,js,jsx}"],
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
        // Page surfaces (neutral-50 / white per design system $background-map)
        surface: {
          DEFAULT: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
        },
        // $primary — purple
        brand: {
          50: "#f0eaf2",
          100: "#d1bdd7",
          200: "#ba9dc4",
          300: "#9b71a9",
          400: "#875598",
          500: "#692b7e",
          600: "#602773",
          700: "#4b1f59",
          800: "#3a1845",
          900: "#2c1235",
        },
        // $secondary — blue (links / live indicators / informational chips)
        info: {
          50: "#e1eaff",
          100: "#c8d4f5",
          200: "#aebff0",
          300: "#88a1ea",
          400: "#718fe5",
          500: "#4e73df",
          600: "#4769cb",
          700: "#37529e",
          800: "#2b3f7b",
          900: "#21305e",
        },
        // $success — green (used for the "Verified" tier + positive tones)
        success: {
          50: "#dff7ef",
          100: "#baf2e4",
          200: "#98ebd7",
          300: "#69e2c5",
          400: "#4cddba",
          500: "#1fd4a9",
          600: "#1cc19a",
          700: "#169778",
          800: "#11755d",
          900: "#0d5947",
        },
        // $warning — orange (used for the "Partial" tier + watch flags)
        warn: {
          50: "#fff3e0",
          100: "#fae3b5",
          200: "#f8d591",
          300: "#f5c25f",
          400: "#f3b640",
          500: "#f0a410",
          600: "#da950f",
          700: "#aa740b",
          800: "#845a09",
          900: "#654507",
        },
        // $error — red (used for review-severity flags + error states)
        danger: {
          50: "#f7dfe1",
          100: "#f1c3cc",
          200: "#eba6b3",
          300: "#e27d90",
          400: "#dc647a",
          500: "#d33d59",
          600: "#c03851",
          700: "#962b3f",
          800: "#742231",
          900: "#742231",
        },
      },
      boxShadow: {
        // Soft elevation scale tuned to design system $gray-shadow-map.
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -16px rgba(15, 23, 42, 0.10)",
        "card-hover":
          "0 2px 4px rgba(15, 23, 42, 0.06), 0 12px 32px -16px rgba(15, 23, 42, 0.14)",
        "ring-brand":
          "0 0 0 1px rgba(105, 43, 126, 0.20), 0 8px 30px -14px rgba(105, 43, 126, 0.25)",
      },
    },
  },
  plugins: [],
};
