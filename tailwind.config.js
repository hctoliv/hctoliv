/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a6b3c",
          dark: "#145530",
          light: "#d1fae5",
        },
        secondary: "#0f172a",
        muted: "#64748b",
        accent: "#f59e0b",
      },
    },
  },
  plugins: [],
};
