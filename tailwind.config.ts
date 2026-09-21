import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--crm-bg)",
        foreground: "var(--crm-text)",
        // Brand Identity (extracted from main website)
        cream: {
          DEFAULT: "#EDEAE5",
          dark: "#E3DFD9",
          light: "#F5F3F0",
        },
        navy: {
          DEFAULT: "#2D3561",
          dark: "#1F2744",
          light: "#3D4575",
        },
        lavender: {
          DEFAULT: "#A8ACC4",
          light: "#C5C8D9",
          dark: "#8B8FA8",
        },
        charcoal: "#3D3D3D",
        brand: {
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
        dark: {
          bg: "var(--crm-bg)",
          card: "var(--crm-card)",
          cardHover: "var(--crm-card-hover)",
          border: "var(--crm-border)",
          borderLight: "var(--crm-border-light)",
          muted: "var(--crm-muted)",
          subtle: "var(--crm-subtle)",
        },
        accent: {
          cyan: "#06B6D4",
          emerald: "#10B981",
          amber: "#F59E0B",
          rose: "#F43F5E",
          violet: "#8B5CF6",
        }
      },
      fontFamily: {
        heading: ["Cormorant Garamond", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 20px -5px rgba(45, 53, 97, 0.3)",
        glowEmerald: "0 0 20px -5px rgba(16, 185, 129, 0.4)",
        card: "var(--crm-shadow-card)",
        cardHover: "var(--crm-shadow-hover)",
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.25rem',
      }
    },
  },
  plugins: [],
};
export default config;
