/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Animation classes
    'animate-pulse-slow',
    'animate-gradient-shift',
    'animate-gentle-sway',
    'animate-card-float',
    'animate-text-glow',
    'animate-carousel-down',
    'animate-carousel-down-delayed',
    // Layout classes
    'block', 'hidden', 'flex', 'absolute', 'relative', 'fixed', 'grid',
    'min-h-screen', 'h-screen', 'w-full', 'h-full',
    // Background classes used in login
    'bg-gradient-to-br', 'from-gray-900', 'via-black', 'to-gray-900',
    'backdrop-blur-2xl', 'bg-black/20', 'border-white/10',
    // Text and color classes
    'text-white', 'text-white/70', 'text-white/90', 'text-white/60',
    'border-white/20', 'focus:border-white/50', 'bg-white/5', 'bg-white/10',
    // Shadow and effect classes
    'shadow-lg', 'shadow-xl', 'drop-shadow-lg', 'drop-shadow-sm',
    // Overflow and positioning
    'overflow-hidden', 'overflow-auto', 'z-30', 'z-10',
    // Pattern matching for dynamic classes
    {
      pattern: /animate-.+/,
      variants: ['hover', 'focus', 'active', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
    {
      pattern: /bg-.+\/\d+/,
      variants: ['hover', 'focus'],
    },
    {
      pattern: /text-.+\/\d+/,
    },
    {
      pattern: /border-.+\/\d+/,
      variants: ['hover', 'focus'],
    },
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.95" },
        },
        "gradient-shift": {
          "0%, 100%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
        },
        "gentle-sway": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "25%": { transform: "translateY(-8px) rotate(0.5deg)" },
          "50%": { transform: "translateY(-5px) rotate(0deg)" },
          "75%": { transform: "translateY(-10px) rotate(-0.5deg)" },
        },
        "card-float": {
          "0%, 100%": { transform: "translateY(0px) scale(1)" },
          "50%": { transform: "translateY(-15px) scale(1.01)" },
        },
        "text-glow": {
          "0%, 100%": { "text-shadow": "0 0 10px rgba(255, 255, 255, 0.3)" },
          "50%": { "text-shadow": "0 0 20px rgba(255, 255, 255, 0.6), 0 0 30px rgba(255, 255, 255, 0.3)" },
        },
        "carousel-down": {
          "0%": { transform: "translateY(-120vh)" },
          "100%": { transform: "translateY(120vh)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 8s ease-in-out infinite",
        "gradient-shift": "gradient-shift 15s ease-in-out infinite",
        "gentle-sway": "gentle-sway 12s ease-in-out infinite",
        "card-float": "card-float 8s ease-in-out infinite",
        "text-glow": "text-glow 4s ease-in-out infinite",
        "carousel-down": "carousel-down 25s linear infinite",
        "carousel-down-delayed": "carousel-down 25s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}