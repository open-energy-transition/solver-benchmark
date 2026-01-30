import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-3",
    "hover:bg-lavender",
    "bg-[#F0F4F2]",
    "hover:bg-[#F0F4F2]",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      screens: {
        "3xl": "1920px",
        "4xl": "2560px",
      },
      colors: {
        black: "#000000",
        "columnbia-blue": "#BFDBF7",
        "dark-green": "#4C5C51",
        "dark-grey": "#4F4E4E",
        "green-pop": "#6B9080",
        grey: "#E4E2DF",
        gunmetal: "#022B3A",
        lavender: "#E1E5F2",
        navy: "#022B3B",
        neutral: "##BFD8C7",
        olive: "#7C9885",
        stroke: "#EBEFF2",
        teal: "#1F7A8C",
        white: "#ffffff",
        "light-blue": "#F5F7FA",
        "light-grey": "#E4E7E9",
        "lime-green": "#E5EEEB",
      },
      fontFamily: {
        league: ["var(--font-league-spartan)", "sans-serif"],
        lato: ["var(--font-lato)", "sans-serif"],
        grotesk: ["var(--font-space-grotesk)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      fontSize: {
        "4.5xl": "2.5rem",
        "6.5xl": "4rem",
      },
      lineHeight: {
        "1.1": "1.1",
        "1.2": "1.2",
        "1.3": "1.3",
        "1.4": "1.4",
        "1.5": "1.5",
      },
      maxWidth: {
        "8xl": "1440px",
      },
      padding: {
        "4.5": "1.125rem",
      },
      zIndex: {
        max: "999999",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    function ({
      addUtilities,
    }: {
      addUtilities: (utilities: Record<string, any>) => void;
    }) {
      addUtilities({
        ".box-decoration-clone": {
          "-webkit-box-decoration-break": "clone",
          "box-decoration-break": "clone",
        },
        ".box-decoration-slice": {
          "-webkit-box-decoration-break": "slice",
          "box-decoration-break": "slice",
        },
      });
    },
  ],
} satisfies Config;
