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
        background: "#070B12",
        "background-secondary": "#0B111B",
        surface: "#101722",
        "surface-elevated": "#151E2B",
        "surface-card": "#101722",
        "surface-hover": "#1A2536",
        
        primary: "#00A6C6",
        "primary-hover": "#00C2E8",
        "primary-glow": "rgba(0, 166, 198, 0.15)",
        
        secondary: "#2B6954",
        "secondary-hover": "#347D64",
        
        danger: "#FF4D67",
        "danger-glow": "rgba(255, 77, 103, 0.15)",
        
        warning: "#F5B942",
        "warning-glow": "rgba(245, 185, 66, 0.15)",
        
        success: "#35D07F",
        "success-glow": "rgba(53, 208, 127, 0.15)",
        
        "text-primary": "#F5F7FA",
        "text-secondary": "#8B98AA",
        "text-muted": "#5A677A",
        
        border: "rgba(255, 255, 255, 0.08)",
        "border-subtle": "rgba(255, 255, 255, 0.05)",
        "border-accent": "rgba(0, 166, 198, 0.3)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(0, 166, 198, 0.25)",
        "glow-danger": "0 0 20px -5px rgba(255, 77, 103, 0.25)",
        "glow-success": "0 0 20px -5px rgba(53, 208, 127, 0.25)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
