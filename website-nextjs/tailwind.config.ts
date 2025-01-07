import type { Config } from "tailwindcss"

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
  ],
  theme: {
    extend: {
      colors: {
        "black": "#000000",
        "columnbia-blue": "#BFDBF7",
        "dark-green": "#4C5C51",
        "dark-grey": "#8C8C8C",
        "green-pop": "#6B9080",
        "grey": "#E4E2DF",
        "gunmetal": "#022B3A",
        "lavender": "#E1E5F2",
        "navy": "#022B3B",
        "neutral": "##BFD8C7",
        "olive": "#7C9885",
        "stroke": "#EBEFF2",
        "teal": "#1F7A8C",
        "white": "#ffffff",
        "light-blue": "#F5F7FA",
        "light-grey": "#E4E7E9",
        "lime-green": "#E5EEEB"
      },
      fontFamily: {
        league: ["var(--font-league-spartan)", "sans-serif"],
        lato: ["var(--font-lato)", "sans-serif"],
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, any>) => void }) {
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
} satisfies Config
