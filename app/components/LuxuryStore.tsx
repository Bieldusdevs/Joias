'use client'

import Image from 'next/image'
import { AnimatePresence, motion, useScroll, useTransform, type Variants } from 'framer-motion'
import { ShoppingBag, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { products, formatPrice } from '@/app/lib/products'
import type { Product } from '@/app/types/product'

type CartItem = Product & { quantity: number; material: string }

const luxuryEase = [0.19, 1, 0.22, 1] as const
const reveal: Variants = {
  hidden: { opacity: 0, y: 42, filter: 'blur(18px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.05, ease: luxuryEase } }
}

function BonitaLogo({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center font-serif uppercase tracking-[.28em] text-[#3b2730] ${small ? 'text-sm' : 'text-base md:text-lg'}`} aria-label="BONITA">
      BON
      <span className="relative inline-block px-[.04em]">
        <span className="absolute left-1/2 top-[-.86em] -translate-x-1/2 text-[.55em] leading-none text-gold drop-shadow-[0_0_10px_rgba(201,157,75,.65)]">◆</span>
        I
      </span>
      TA
    </span>
  )
}

export function LuxuryStore() {
  const heroRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1.03, 1.12])
  const heroBlur = useTransform(scrollYProgress, [0, 0.75], ['blur(0px)', 'blur(10px)'])

  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState('Ouro 18k')
  const [toast, setToast] = useState('')
  const [mobileNav, setMobileNav] = useState(false)

  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.quantity, 0), [cart])
  const quantity = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-gsap-reveal]').forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 74, filter: 'blur(18px)' },
          { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.35, ease: 'power4.out', scrollTrigger: { trigger: element, start: 'top 86%' } }
        )
      })
      gsap.utils.toArray<HTMLElement>('[data-soft-parallax]').forEach((element) => {
        gsap.to(element, {
          yPercent: Number(element.dataset.softParallax || -8),
          ease: 'none',
          scrollTrigger: { trigger: element, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
        })
      })
      gsap.to('[data-cinematic-panel]', {
        scale: 1.045,
        filter: 'blur(0px)',
        ease: 'none',
        scrollTrigger: { trigger: '[data-atelier]', start: 'top bottom', end: 'bottom top', scrub: true }
      })
    })
    return () => ctx.revert()
  }, [])

  const notify = (message: string) => {
    setToast(message)
    window.clearTimeout((notify as unknown as { timer?: number }).timer)
    ;(notify as unknown as { timer?: number }).timer = window.setTimeout(() => setToast(''), 2600)
  }

  const addToCart = (product: Product, material = selectedMaterial) => {
    setCart((items) => {
      const current = items.find((item) => item.id === product.id && item.material === material)
      if (current) return items.map((item) => (item === current ? { ...item, quantity: item.quantity + 1 } : item))
      return [...items, { ...product, quantity: 1, material }]
    })
    notify(`${product.name} adicionado ao carrinho`)
  }

  const checkout = async () => {
    if (!cart.length) return notify('Adicione uma peça antes de iniciar o checkout.')
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(({ id, quantity, material }) => ({ id, quantity, material })) })
      })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else notify(data.message || 'Checkout demo reservado. Configure Stripe para pagamento real.')
    } catch {
      notify('Checkout demo reservado. Configure Stripe para pagamento real.')
    }
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-5 text-[#3b2730] transition md:px-10 lg:px-14">
        <a href="#hero" className="rounded-full border border-white/50 bg-white/35 px-5 py-3 shadow-[0_20px_70px_rgba(255,184,210,.22)] backdrop-blur-2xl transition hover:bg-white/60">
          <BonitaLogo />
        </a>
        <nav className={`${mobileNav ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0'} fixed inset-x-4 top-24 grid gap-5 rounded-[2rem] border border-white/70 bg-white/75 p-6 text-xs uppercase tracking-[.18em] text-[#694a58]/80 shadow-[0_30px_90px_rgba(255,184,210,.28)] backdrop-blur-2xl transition lg:pointer-events-auto lg:static lg:flex lg:translate-y-0 lg:gap-9 lg:border-white/40 lg:bg-white/25 lg:px-6 lg:py-3 lg:opacity-100`}>
          {['collection', 'product', 'atelier', 'trust', 'journal'].map((item) => <a key={item} className="editorial-line" href={`#${item}`} onClick={() => setMobileNav(false)}>{item}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setCartOpen(true)} className="rounded-full border border-white/60 bg-white/35 px-4 py-3 text-xs uppercase tracking-[.14em] shadow-[0_18px_60px_rgba(255,184,210,.18)] backdrop-blur-2xl transition hover:border-gold/70 hover:bg-white/70">
            Bag <span className="text-gold">{quantity}</span>
          </button>
          <button onClick={() => setMobileNav((value) => !value)} className="grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white/35 backdrop-blur-xl lg:hidden" aria-label="Abrir menu">☰</button>
        </div>
      </header>

      <main>
        <section ref={heroRef} id="hero" className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fff7fa] px-4 pb-24 pt-32 text-[#3b2730]">
          <motion.div className="absolute inset-0" style={{ y: heroY, scale: heroScale, filter: heroBlur }}>
            <Image src="/assets/hero-jewelry.png" alt="Peças de ouro BONITA sobre seda rosa bebê e mármore branco" fill priority sizes="100vw" className="object-cover saturate-110" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,247,250,.92),rgba(255,247,250,.38)_50%,rgba(255,255,255,.86)),radial-gradient(circle_at_64%_44%,transparent_0_22%,rgba(255,231,240,.72)_66%)]" />
            <motion.div className="absolute inset-[-20%] bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,.72)_45%,rgba(244,184,203,.26)_49%,transparent_58%)] mix-blend-screen" animate={{ x: ['-70%', '70%'] }} transition={{ duration: 5.8, repeat: Infinity, ease: luxuryEase }} />
          </motion.div>
          <motion.div className="relative z-10 w-full max-w-7xl" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.13 } } }}>
            <motion.p variants={reveal} className="mb-5 text-xs uppercase tracking-[.24em] text-gold">BONITA / Gold Jewelry 2026</motion.p>
            <motion.h1 variants={reveal} className="max-w-6xl font-serif text-[clamp(4rem,12vw,12rem)] leading-[.88] tracking-[-.06em] text-balance">Soft Gold, Made to Glow</motion.h1>
            <motion.p variants={reveal} className="mt-8 max-w-xl text-base leading-8 text-[#6c5360] md:text-xl">Peças de ouro contemporâneas em uma experiência branca, rosa bebê e luminosa — feminina, premium e delicadamente cinematográfica.</motion.p>
            <motion.div variants={reveal} className="mt-10 flex flex-wrap gap-3">
              <a className="rounded-full bg-gold px-6 py-4 text-xs uppercase tracking-[.16em] text-white shadow-[0_22px_80px_rgba(201,157,75,.28)] transition hover:-translate-y-1 hover:blur-[.2px]" href="#collection">Explore Collection</a>
              <button onClick={() => setActiveProduct(products[0])} className="rounded-full border border-white/70 bg-white/35 px-6 py-4 text-xs uppercase tracking-[.16em] text-[#3b2730] shadow-[0_20px_70px_rgba(255,184,210,.24)] backdrop-blur-xl transition hover:bg-white/70">Ver assinatura</button>
            </motion.div>
          </motion.div>
        </section>

        <section className="grid gap-10 border-b border-pink-200/60 bg-[#fffafc] px-4 py-24 text-[#3b2730] md:grid-cols-[.35fr_1.25fr_.8fr] md:px-14 lg:py-40">
          <div data-gsap-reveal className="font-serif text-7xl leading-none text-gold/45 md:text-9xl">01</div>
          <h2 data-gsap-reveal className="font-serif text-[clamp(2.8rem,6vw,7.2rem)] leading-none tracking-[-.055em]">Delicadeza visual, ouro polido e uma experiência que respira luz.</h2>
          <p data-gsap-reveal className="leading-8 text-[#765d69]">A BONITA combina fotografia de peças reais em ouro, movimentos suaves, camadas translúcidas, blur editorial e microinterações desenhadas para transmitir desejo sem excesso.</p>
        </section>

        <section id="collection" className="bg-[radial-gradient(circle_at_10%_0%,rgba(255,199,218,.55),transparent_32%),#fff7fa] px-4 py-24 text-[#3b2730] md:px-14 lg:py-40">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div><p data-gsap-reveal className="mb-5 text-xs uppercase tracking-[.24em] text-gold">Featured Collection</p><h2 data-gsap-reveal className="font-serif text-[clamp(3rem,7vw,8rem)] leading-none tracking-[-.055em]">Gold Pieces</h2></div>
            <span className="hidden text-xs uppercase tracking-[.18em] text-gold md:block">Curated 2026</span>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {products.map((product, index) => (
              <motion.article key={product.id} data-gsap-reveal data-cursor className={`group overflow-hidden rounded-[2rem] border border-white/70 bg-white/55 shadow-[0_30px_100px_rgba(255,184,210,.22)] backdrop-blur-xl ${index % 2 ? 'xl:mt-20' : ''}`} whileHover={{ y: -10, scale: 1.015, filter: 'blur(0px)' }} transition={{ duration: 0.6, ease: luxuryEase }}>
                <button onClick={() => setActiveProduct(product)} className="relative h-[380px] w-full overflow-hidden bg-[#ffeef5] md:h-[460px]">
                  <Image src={product.image} alt={product.name} fill sizes="(max-width:768px) 100vw, 25vw" className="object-cover transition duration-[1400ms] group-hover:scale-110 group-hover:rotate-1 group-hover:blur-[.4px]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,.46),transparent_40%),linear-gradient(180deg,transparent,rgba(255,231,240,.42))]" />
                </button>
                <div className="p-6"><h3 className="font-serif text-3xl tracking-[-.04em]">{product.name}</h3><div className="mt-3 flex justify-between gap-4 text-sm text-[#765d69]"><span>{product.category}</span><strong className="text-gold">{formatPrice(product.price)}</strong></div><div className="mt-6 flex gap-2"><button onClick={() => setActiveProduct(product)} className="flex-1 rounded-full border border-pink-200/80 bg-white/45 py-3 text-xs uppercase tracking-[.14em] transition hover:border-gold hover:bg-white">Preview</button><button onClick={() => addToCart(product)} className="flex-1 rounded-full border border-pink-200/80 bg-white/45 py-3 text-xs uppercase tracking-[.14em] transition hover:border-gold hover:bg-white">Add</button></div></div>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="product" className="grid items-center gap-12 bg-white px-4 py-24 text-[#3b2730] md:px-14 lg:grid-cols-[1.05fr_.75fr] lg:py-40">
          <div data-gsap-reveal data-soft-parallax="-6" className="relative h-[520px] overflow-hidden rounded-[2.4rem] border border-pink-100 bg-[#fff2f7] shadow-[0_40px_120px_rgba(255,184,210,.28)] md:h-[690px]">
            <Image src="/assets/ring.png" alt="Anel de ouro BONITA em fotografia macro" fill sizes="(max-width:768px) 100vw, 55vw" className="object-cover" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_32%,rgba(255,255,255,.18),transparent_24%),linear-gradient(180deg,transparent,rgba(255,247,250,.34))]" />
            <motion.div className="absolute right-8 top-8 rounded-full border border-white/70 bg-white/55 px-5 py-3 text-xs uppercase tracking-[.16em] text-gold shadow-[0_18px_60px_rgba(255,184,210,.3)] backdrop-blur-xl" animate={{ y: [0, -10, 0], filter: ['blur(0px)', 'blur(.7px)', 'blur(0px)'] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>Macro Gold</motion.div>
          </div>
          <article data-gsap-reveal>
            <p className="mb-5 text-xs uppercase tracking-[.24em] text-gold">Signature Product / Photo Experience</p>
            <h2 className="font-serif text-[clamp(3rem,5vw,6rem)] leading-none tracking-[-.055em]">Anel Aurora Gold</h2>
            <p className="my-6 font-serif text-3xl text-gold">€ 12.800</p>
            <p className="leading-8 text-[#765d69]">Sem joias 3D: o foco agora é fotografia macro de peças de ouro, zoom suave, camadas de luz rosa bebê, blur refinado e transições fluidas para manter o site leve e premium.</p>
            <div className="my-8 flex flex-wrap gap-3">
              {products[0].materials.map((material) => <button key={material} onClick={() => setSelectedMaterial(material)} className={`rounded-full border px-4 py-3 text-xs uppercase tracking-[.12em] transition ${selectedMaterial === material ? 'border-gold bg-gold/10 text-gold' : 'border-pink-200 text-[#3b2730]'}`}>{material}</button>)}
            </div>
            <div className="flex flex-wrap gap-3"><button onClick={() => { addToCart(products[0]); setCartOpen(true) }} className="rounded-full bg-gold px-6 py-4 text-xs uppercase tracking-[.16em] text-white shadow-[0_22px_80px_rgba(201,157,75,.28)]">Comprar agora</button><button onClick={() => setActiveProduct(products[0])} className="rounded-full border border-pink-200 bg-white/50 px-6 py-4 text-xs uppercase tracking-[.16em] shadow-[0_18px_60px_rgba(255,184,210,.18)]">Detalhes</button></div>
          </article>
        </section>

        <section id="atelier" data-atelier className="border-y border-pink-100 bg-[#fff7fa] text-[#3b2730]">
          <div className="grid min-h-[82vh] place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_50%,rgba(255,199,218,.55),transparent_44%),#fffafc] px-4 text-center">
            <h2 data-cinematic-panel data-gsap-reveal className="max-w-6xl font-serif text-[clamp(3.2rem,8vw,9rem)] leading-none tracking-[-.055em] blur-[2px]">O ouro toca a pele como luz.</h2>
          </div>
          <div className="grid gap-10 bg-gradient-to-br from-white via-[#fff5f9] to-[#ffe8f1] px-4 py-24 md:grid-cols-2 md:px-14 lg:py-36">
            <p data-gsap-reveal className="text-lg leading-9 text-[#765d69]">A BONITA nasce da vontade de transformar peças de ouro em objetos de afeto: suaves, luminosos e eternos. Cada acabamento é pensado para refletir pele, movimento e presença.</p>
            <p data-gsap-reveal className="text-lg leading-9 text-[#765d69]">A nova paleta rosa bebê e branco cria uma atmosfera limpa e irresistível, com brilho dourado controlado e visual de campanha internacional de beleza.</p>
          </div>
        </section>

        <section id="trust" className="bg-white px-4 py-24 text-[#3b2730] md:px-14 lg:py-40">
          <p data-gsap-reveal className="mb-5 text-xs uppercase tracking-[.24em] text-gold">Assurance</p>
          <h2 data-gsap-reveal className="mb-12 font-serif text-[clamp(3rem,7vw,8rem)] leading-none tracking-[-.055em]">Confiança dourada</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {[['01','Certificado de Autenticidade','Documento digital e físico com origem, quilatagem, lote e assinatura do atelier.'],['02','Ouro Premium','Peças finalizadas à mão, testadas em acabamento, polimento e resistência.'],['03','Ethical Sourcing','Metais adquiridos com compromisso socioambiental e cadeia rastreável.']].map(([n,title,copy]) => <article key={n} data-gsap-reveal className="rounded-[2rem] border border-pink-100 bg-[#fff8fb] p-8 shadow-[0_30px_90px_rgba(255,184,210,.18)]"><span className="font-serif text-6xl text-gold/45">{n}</span><h3 className="mt-10 font-serif text-3xl">{title}</h3><p className="mt-4 leading-7 text-[#765d69]">{copy}</p></article>)}
          </div>
        </section>

        <section id="journal" className="grid min-h-[70vh] place-items-center bg-[linear-gradient(90deg,rgba(255,247,250,.92),rgba(255,247,250,.58)),url('/assets/bracelet.png')] bg-cover bg-fixed bg-center px-4 py-24 text-[#3b2730] md:px-14">
          <div className="w-full"><p data-gsap-reveal className="mb-5 text-xs uppercase tracking-[.24em] text-gold">BONITA Journal</p><div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end"><h2 data-gsap-reveal className="max-w-5xl font-serif text-[clamp(3rem,7vw,8rem)] leading-none tracking-[-.055em]">A private appointment with softness, gold and intention.</h2><a data-gsap-reveal href="mailto:concierge@bonita.com" className="rounded-full border border-pink-200 bg-white/55 px-6 py-4 text-xs uppercase tracking-[.16em] shadow-[0_18px_60px_rgba(255,184,210,.22)] backdrop-blur-xl">Agendar consulta</a></div></div>
        </section>
      </main>

      <footer className="grid gap-10 border-t border-pink-100 bg-[#fffafc] px-4 py-14 text-[#765d69] md:grid-cols-[1fr_1fr_.6fr] md:px-14">
        <div><div className="mb-6"><BonitaLogo small /></div><p>Contemporary gold jewelry in baby pink and white light.</p></div>
        <form onSubmit={(event) => { event.preventDefault(); notify('Inscrição recebida. Bem-vinda à lista privada BONITA.') }}><label className="mb-4 block text-xs uppercase tracking-[.18em] text-gold">Newsletter privada</label><div className="flex max-w-lg border-b border-pink-200"><input required type="email" placeholder="seu@email.com" className="flex-1 bg-transparent px-1 py-4 outline-none"/><button className="text-xs uppercase tracking-[.14em] text-gold">Entrar</button></div></form>
        <nav className="grid items-start gap-3 text-sm uppercase tracking-[.1em]"><a className="editorial-line" href="#collection">Collection</a><a className="editorial-line" href="#atelier">Atelier</a><a className="editorial-line" href="#trust">Certificates</a><a className="editorial-line" href="https://instagram.com">Instagram</a></nav>
      </footer>

      <AnimatePresence>
        {activeProduct && (
          <motion.div className="fixed inset-0 z-[120] grid place-items-center bg-[#3b2730]/30 p-3 backdrop-blur-xl" initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(18px)' }} exit={{ opacity: 0 }}>
            <motion.div className="relative grid max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[2rem] border border-white/70 bg-white/88 text-[#3b2730] shadow-[0_45px_140px_rgba(255,184,210,.36)] backdrop-blur-2xl md:grid-cols-[1.05fr_.9fr]" initial={{ y: 44, scale: .94, filter: 'blur(18px)' }} animate={{ y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ y: 44, scale: .94, filter: 'blur(18px)' }} transition={{ ease: luxuryEase, duration: .65 }}>
              <button onClick={() => setActiveProduct(null)} className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-pink-200 bg-white/70"><X size={18}/></button>
              <div className="relative min-h-[380px] bg-[#fff0f6] md:min-h-[650px]"><Image src={activeProduct.image} alt={activeProduct.name} fill sizes="50vw" className="object-cover" /></div>
              <div className="flex flex-col justify-center p-8 md:p-14"><p className="mb-5 text-xs uppercase tracking-[.24em] text-gold">{activeProduct.category}</p><h2 className="font-serif text-[clamp(2.8rem,5vw,6rem)] leading-none tracking-[-.055em]">{activeProduct.name}</h2><p className="my-6 font-serif text-3xl text-gold">{formatPrice(activeProduct.price)}</p><p className="leading-8 text-[#765d69]">{activeProduct.description}</p><div className="my-8 flex flex-wrap gap-3">{activeProduct.materials.map((material) => <button key={material} onClick={() => setSelectedMaterial(material)} className={`rounded-full border px-4 py-3 text-xs uppercase tracking-[.12em] ${selectedMaterial === material ? 'border-gold bg-gold/10 text-gold' : 'border-pink-200'}`}>{material}</button>)}</div><button onClick={() => addToCart(activeProduct)} className="rounded-full bg-gold px-6 py-4 text-xs uppercase tracking-[.16em] text-white shadow-[0_22px_80px_rgba(201,157,75,.28)]">Adicionar ao carrinho</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartOpen && <motion.aside className="fixed inset-y-0 right-0 z-[130] flex w-full max-w-md flex-col border-l border-pink-100 bg-white/88 text-[#3b2730] shadow-[0_40px_120px_rgba(255,184,210,.28)] backdrop-blur-2xl" initial={{ x: '105%', filter: 'blur(12px)' }} animate={{ x: 0, filter: 'blur(0px)' }} exit={{ x: '105%', filter: 'blur(12px)' }} transition={{ ease: luxuryEase, duration: .7 }}><div className="flex items-start justify-between border-b border-pink-100 p-7"><div><p className="mb-3 text-xs uppercase tracking-[.24em] text-gold">Shopping Bag</p><h2 className="font-serif text-4xl">Sua seleção</h2></div><button onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-pink-200"><X size={18}/></button></div><div className="flex-1 overflow-auto p-6">{cart.length ? cart.map((item) => <div key={`${item.id}-${item.material}`} className="grid grid-cols-[82px_1fr_auto] gap-4 border-b border-pink-100 py-4"><Image src={item.image} alt={item.name} width={82} height={82} className="h-20 w-20 rounded-2xl object-cover"/><div><h3 className="font-serif text-xl">{item.name}</h3><p className="text-sm text-[#765d69]">{item.material} · Qtd. {item.quantity}</p><p className="text-sm text-gold">{formatPrice(item.price)}</p></div><button onClick={() => setCart((items) => items.filter((candidate) => candidate !== item))} className="text-gold">×</button></div>) : <p className="text-sm leading-7 text-[#765d69]">Sua seleção está vazia. Explore a coleção para adicionar peças ao carrinho.</p>}</div><div className="border-t border-pink-100 p-7"><div className="mb-5 flex justify-between"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div><button onClick={checkout} className="w-full rounded-full bg-gold px-6 py-4 text-xs uppercase tracking-[.16em] text-white shadow-[0_22px_80px_rgba(201,157,75,.28)]"><ShoppingBag className="mr-2 inline" size={16}/> Checkout seguro</button><p className="mt-4 text-xs leading-5 text-[#765d69]">Stripe-ready. Se as variáveis não estiverem configuradas, o endpoint retorna modo demonstração.</p></div></motion.aside>}
      </AnimatePresence>

      <AnimatePresence>{toast && <motion.div className="fixed bottom-6 left-1/2 z-[160] -translate-x-1/2 rounded-full border border-pink-200 bg-white/90 px-5 py-4 text-center text-sm text-gold shadow-[0_22px_80px_rgba(255,184,210,.28)] backdrop-blur-xl" initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: 30, filter: 'blur(12px)' }}>{toast}</motion.div>}</AnimatePresence>
    </>
  )
}
