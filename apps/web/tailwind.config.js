/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Force light mode only - no dark mode
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic color tokens - always consistent
        background: "#ffffff",
        foreground: "#111827",
        card: "#ffffff",
        "card-foreground": "#111827",
        muted: "#f3f4f6",
        "muted-foreground": "#6b7280",
        border: "#e5e7eb",
        input: "#e5e7eb",
        ring: "#3b82f6",
        // Primary colors
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#ffffff",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Secondary colors
        secondary: {
          DEFAULT: "#f3f4f6",
          foreground: "#111827",
        },
        // Destructive (red) colors for errors/delete actions
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        // Accent colors
        accent: {
          DEFAULT: "#f3f4f6",
          foreground: "#111827",
        },
      },
      borderColor: {
        DEFAULT: "#e5e7eb",
      },
    },
  },
  plugins: [],
};
