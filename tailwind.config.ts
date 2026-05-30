import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary CTA blue (was terracotta)
        terracotta: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          DEFAULT: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3166',
        },
        // Clean white / light blue-white (was cream)
        cream: {
          50:  '#ffffff',
          100: '#f8f9ff',
          DEFAULT: '#eef2ff',
          300: '#dde5f5',
          400: '#c5d0e6',
        },
        // Dark navy (was forest)
        forest: {
          50:  '#eef2fb',
          100: '#d4dff5',
          200: '#a9bfeb',
          300: '#7e9fe1',
          DEFAULT: '#1B2855',
          600: '#142044',
          700: '#0f1835',
          800: '#0a1025',
          900: '#060b1e',
        },
        // Sky / powder blue accent (was gold)
        gold: {
          50:  '#f0f7ff',
          100: '#dbeafe',
          200: '#b3d4f8',
          300: '#7cb9f5',
          DEFAULT: '#56a3f5',
          600: '#2462d4',
          700: '#1e52c0',
          800: '#173892',
          900: '#0f2466',
        },
      },
      fontFamily: {
        heading: ['var(--font-cormorant)', 'Georgia', 'serif'],
        body: [
          'var(--font-be-vietnam)',
          'var(--font-noto-sc)',
          'var(--font-noto-jp)',
          'var(--font-noto-kr)',
          'system-ui',
          'sans-serif',
        ],
      },
      animation: {
        'fade-up':   'fadeUp 0.9s ease-out forwards',
        'fade-in':   'fadeIn 0.7s ease-out forwards',
        'fade-down': 'fadeDown 0.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeDown: {
          '0%':   { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(11,28,63,0.90) 0%, rgba(15,32,72,0.85) 60%, rgba(6,11,30,0.95) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
