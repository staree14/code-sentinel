import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // New pixel theme
        bg:     "#0d1117",
        bg2:    "#161b22",
        bg3:    "#21262d",
        "pixel-text":   "#e6edf3",
        muted:  "#7d8590",
        "pixel-green":  "#39d353",
        "pixel-red":    "#f85149",
        "pixel-yellow": "#d29922",
        "pixel-blue":   "#58a6ff",
        "pixel-purple": "#bc8cff",
        "pixel-border": "#30363d",
        "aws-orange":   "#FF9900",
        // Legacy (keep for components not yet updated)
        "cyber-blue":   "#58a6ff",
        "cyber-purple": "#bc8cff",
        surface:        "#161b22",
      },
      fontFamily: {
        sans:          ["var(--font-ibm-plex)", "IBM Plex Mono", "monospace"],
        mono:          ["var(--font-ibm-plex)", "IBM Plex Mono", "monospace"],
        "press-start": ["var(--font-press-start)", "Press Start 2P", "cursive"],
        "ibm-plex":    ["var(--font-ibm-plex)", "IBM Plex Mono", "monospace"],
        geist:         ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
