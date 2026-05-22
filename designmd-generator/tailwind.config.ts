import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        "bg-black": "#000000",
        "surf-1": "#0A0A0A",
        "surf-2": "#111111",
        "surf-3": "#1A1A1A",
        "surf-4": "#1F1F1F",
        "surf-5": "#292929",
        "surf-6": "#0D0D0D",
        "border-match": "#2E2E2E",
        "border-active": "#454545",
        "muted-2": "#666666",
        "secondary-tint": "#878787",
        "text-3": "#8F8F8F",
        "muted-text": "#A0A0A0",
        "text-2": "#D0D0D0",
        "text-1": "#EDEDED",
        "text-white": "#FFFFFF",
        "accent-cyan": "#A7D7D2",
        "accent-pink": "#A7D7D2",
        "success-green": "#3DD68C",
        "error-red": "#F87171",
        "warning-orange": "#F5A623",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        "pixel-line": ["VT323", "monospace"],
        "pixel-square": ["VT323", "monospace"],
        geist: ["Geist", "sans-serif"],
        "geist-mono": ["Geist Mono", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
