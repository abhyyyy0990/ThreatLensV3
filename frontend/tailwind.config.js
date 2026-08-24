/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        "background-subtle": "#F1F5F9",
        surface: "#FFFFFF",
        "surface-elevated": "#FFFFFF",
        "surface-muted": "#F8FAFC",
        "surface-hover": "#F1F5F9",
        
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "#EFF6FF",
          border: "#BFDBFE",
        },
        
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          subtle: "#FEF2F2",
          border: "#FECACA",
          text: "#991B1B",
        },
        
        warning: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          subtle: "#FFFBEB",
          border: "#FDE68A",
          text: "#92400E",
        },
        
        success: {
          DEFAULT: "#10B981",
          hover: "#059669",
          subtle: "#ECFDF5",
          border: "#A7F3D0",
          text: "#065F46",
        },
        
        "text-primary": "#0F172A",
        "text-secondary": "#475569",
        "text-muted": "#94A3B8",
        
        border: {
          DEFAULT: "#E2E8F0",
          subtle: "#F1F5F9",
          strong: "#CBD5E1",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
        "card-hover": "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
        dropdown: "0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
        button: "0 1px 2px 0 rgba(37, 99, 235, 0.2)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
}
