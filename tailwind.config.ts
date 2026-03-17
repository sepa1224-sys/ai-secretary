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
      colors: {
        navy: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5bafd",
          400: "#8193fa",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#1e3a5f",
          900: "#0f1f3d",
          950: "#0a1628",
        },
      },
      animation: {
        "bounce-dot": "bounce 1.4s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
