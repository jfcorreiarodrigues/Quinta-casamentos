import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          primary: "#C9A96E",
          dark: "#A0785A",
          deep: "#7A6040",
        },
        urgency: {
          overdue: "#C97B8A",
          urgent: "#D4855A",
          soon: "#B8993A",
          upcoming: "#6B8CAE",
          done: "#7A9E7E",
        },
        cream: "#FAF7F2",
        ink: "#2A2118",
        muted: "#9A8A6A",
        line: "#EDE5D5",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
