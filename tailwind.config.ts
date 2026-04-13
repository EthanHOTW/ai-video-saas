import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sand: {
          50:  '#faf7f2',
          100: '#f5f0e6',
          200: '#ebe3d3',
          300: '#ddd2bb',
          400: '#c9b899',
          500: '#b8a17c',
          600: '#a68b62',
          700: '#8c7350',
          800: '#735e42',
          900: '#5e4d38',
          950: '#1e1a14',
        },
        accent: {
          DEFAULT: '#c49a6c',
          light: '#d4aa7c',
          dark: '#b08650',
          50: '#fdf6ee',
          100: '#f9e9d2',
          200: '#f3d0a3',
          300: '#ebb46f',
          400: '#c49a6c',
          500: '#b08650',
          600: '#9a7244',
          700: '#7f5b38',
          800: '#6a4b32',
          900: '#583e2c',
        },
      },
    },
  },
  plugins: [],
};
export default config;
