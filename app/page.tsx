import { Cursor } from '@/app/components/Cursor'
import { IntroExperience } from '@/app/components/IntroExperience'
import { Loader } from '@/app/components/Loader'
import { LuxuryStore } from '@/app/components/LuxuryStore'

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    name: 'BONITA',
    description: 'Contemporary gold jewelry brand with baby pink and white premium visual identity.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://bonita-jewelry.vercel.app',
    sameAs: ['https://www.instagram.com/', 'https://www.pinterest.com/'],
    makesOffer: [
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Anel Aurora Gold' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Colar Luz Gold' } }
    ]
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Loader />
      <IntroExperience />
      <Cursor />
      <LuxuryStore />
    </>
  )
}
