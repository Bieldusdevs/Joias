import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BONITA — Gold Jewelry E-Commerce',
  description: 'BONITA é uma joalheria contemporânea de peças de ouro com estética rosa bebê, branco, luxo suave e experiência imersiva.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bonita-jewelry.vercel.app'),
  openGraph: {
    title: 'BONITA — Soft Gold, Made to Glow',
    description: 'Peças de ouro em uma experiência premium rosa bebê e branca.',
    type: 'website',
    images: ['/assets/hero-jewelry.png']
  },
  robots: { index: true, follow: true }
}

export const viewport: Viewport = {
  themeColor: '#FFF7FA',
  width: 'device-width',
  initialScale: 1
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="luxury-grain font-sans antialiased">{children}</body>
    </html>
  )
}
