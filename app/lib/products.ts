import type { Product } from '@/app/types/product'

export const products: Product[] = [
  {
    id: 'anel-aurora-gold',
    name: 'Anel Aurora Gold',
    category: 'Ring / Gold Signature',
    price: 12800,
    image: '/assets/ring.png',
    description: 'Anel em ouro polido com desenho delicado, curvas suaves e acabamento espelhado feito à mão para refletir luz com naturalidade.',
    materials: ['Ouro 18k', 'Ouro rosé', 'Ouro branco'],
    stripePriceId: 'price_replace_ring'
  },
  {
    id: 'colar-luz-gold',
    name: 'Colar Luz Gold',
    category: 'Necklace / Gold',
    price: 18400,
    image: '/assets/necklace.png',
    description: 'Colar em ouro de presença leve, criado para acompanhar o colo com brilho quente, feminino e sofisticado.',
    materials: ['Ouro amarelo', 'Ouro branco', 'Ouro rosé'],
    stripePriceId: 'price_replace_necklace'
  },
  {
    id: 'brincos-belle-gold',
    name: 'Brincos Belle Gold',
    category: 'Earrings / Gold',
    price: 9200,
    image: '/assets/earrings.png',
    description: 'Brincos de ouro com silhueta limpa e acabamento luminoso, pensados para composições elegantes de dia e noite.',
    materials: ['Ouro 18k', 'Ouro rosé', 'Acabamento polido'],
    stripePriceId: 'price_replace_earrings'
  },
  {
    id: 'pulseira-bonita-gold',
    name: 'Pulseira BONITA Gold',
    category: 'Bracelet / Gold Icon',
    price: 7600,
    image: '/assets/bracelet.png',
    description: 'Pulseira em ouro com caimento delicado, brilho macio e acabamento artesanal para uma estética premium e atemporal.',
    materials: ['Ouro 18k', 'Ouro branco', 'Acabamento acetinado'],
    stripePriceId: 'price_replace_bracelet'
  }
]

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value)
