import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        paper: "#fbfaf7",
        canvas: "#f6f4ef",
        ink: "#1a1815",
        ntnu: "#c8102e"
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        soft: "0 1px 0 rgba(20,18,15,0.04), 0 12px 28px -18px rgba(20,18,15,0.28)"
      }
    }
  },
  plugins: []
};

export default config;
