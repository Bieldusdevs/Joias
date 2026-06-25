import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#FFF7FA',
        ink: '#FFF0F6',
        ivory: '#3B2730',
        champagne: '#F7BFD1',
        gold: '#C99D4B',
        marble: '#FFFFFF',
        graphite: '#765D69',
        baby: '#FFE6F0'
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
        sans: ['var(--font-sans)']
      },
      boxShadow: {
        gold: '0 24px 90px rgba(201,157,75,.24)',
        editorial: '0 50px 140px rgba(255,184,210,.32)'
      },
      backgroundImage: {
        gold: 'linear-gradient(135deg,#b9852f,#f6d58a 46%,#c99d4b)',
        noir: 'radial-gradient(circle at 70% 0%,rgba(255,199,218,.56),transparent 34%),linear-gradient(180deg,#fff7fa 0%,#ffffff 48%,#ffeaf2 100%)'
      }
    }
  },
  plugins: []
}
export default config
