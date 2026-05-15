import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        base:    "var(--bg-base)",
        raised:  "var(--bg-raised)",
        card:    "var(--bg-card)",
        inset:   "var(--bg-inset)",
        border:  "var(--bg-border)",
        border2: "var(--bg-border2)",
        accent:  "var(--accent)",
        ink: {
          1: "var(--ink-1)",
          2: "var(--ink-2)",
          3: "var(--ink-3)",
          4: "var(--ink-4)",
        },
        signal: {
          green: "var(--green)",
          amber: "var(--amber)",
          red:   "var(--red)",
        },
      },
      transitionTimingFunction: {
        "ease-out-custom": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
