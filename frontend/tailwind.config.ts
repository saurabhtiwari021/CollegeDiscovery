import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F4EF",
        "paper-dim": "#EFEDE5",
        ink: {
          DEFAULT: "#171B1F",
          muted: "#5B6472",
          faint: "#8A93A0",
        },
        navy: {
          950: "#0D1A2B",
          900: "#122238",
          800: "#1B3457",
          700: "#254877",
          600: "#31609E",
        },
        marigold: {
          DEFAULT: "#D98E2B",
          dark: "#B5721C",
          light: "#F1C784",
          50: "#FBF1DF",
        },
        teal: {
          DEFAULT: "#2F7A6C",
          dark: "#215A50",
          light: "#DCEDE9",
        },
        rose: {
          DEFAULT: "#B4463F",
          light: "#F4DEDC",
        },
        line: {
          DEFAULT: "#DEDAD0",
          strong: "#C7C2B4",
        },
      },
      fontFamily: {
        serif: ["'Fraunces'", "ui-serif", "Georgia", "serif"],
        sans: [
          "'Inter'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        none: "none",
      },
      maxWidth: {
        content: "1180px",
      },
      fontSize: {
        "display-lg": ["3.4rem", { lineHeight: "1.04", letterSpacing: "-0.01em" }],
        "display-md": ["2.4rem", { lineHeight: "1.08", letterSpacing: "-0.01em" }],
      },
    },
  },
  plugins: [],
};

export default config;
