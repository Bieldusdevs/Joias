'use client'

import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Draggable from 'gsap/Draggable'
import { Howl } from 'howler'

type IntroState = 'idle' | 'success' | 'hidden'

const GOLD_EASE = [0.19, 1, 0.22, 1] as const

export function IntroExperience() {
  const [state, setState] = useState<IntroState>('idle')
  const [isMobile, setIsMobile] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLDivElement | null>(null)
  const flashRef = useRef<HTMLDivElement | null>(null)
  const particlesRef = useRef<HTMLDivElement | null>(null)
  const soundRef = useRef<Howl | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    soundRef.current = new Howl({
      src: ['/audio/crystal.wav'],
      volume: 0.26,
      preload: true,
      html5: false
    })

    const mobileQuery = window.matchMedia('(max-width: 760px), (pointer: coarse)')
    const updateMobile = () => setIsMobile(mobileQuery.matches)
    updateMobile()
    mobileQuery.addEventListener('change', updateMobile)

    return () => {
      mobileQuery.removeEventListener('change', updateMobile)
      soundRef.current?.unload()
    }
  }, [])

  useEffect(() => {
    if (!ringRef.current || !targetRef.current || isMobile) return
    gsap.registerPlugin(Draggable)

    const ring = ringRef.current
    const target = targetRef.current

    const draggable = Draggable.create(ring, {
      type: 'x,y',
      bounds: rootRef.current || window,
      inertia: false,
      onPress() {
        gsap.to(ring, { scale: 1.06, filter: 'drop-shadow(0 28px 48px rgba(241,221,174,.24))', duration: 0.32 })
      },
      onDrag() {
        const hit = this.hitTest(target, '42%')
        target.classList.toggle('ring-target-hot', hit)
      },
      onRelease() {
        target.classList.remove('ring-target-hot')
        if (this.hitTest(target, '42%')) {
          completeIntro()
          return
        }
        gsap.to(ring, {
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          filter: 'drop-shadow(0 22px 34px rgba(0,0,0,.5)) blur(.2px)',
          duration: 0.9,
          ease: 'elastic.out(1, .72)'
        })
      }
    })[0]

    return () => {
      draggable.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  const completeIntro = () => {
    if (completedRef.current) return
    completedRef.current = true
    setState('success')

    const root = rootRef.current
    const ring = ringRef.current
    const target = targetRef.current
    const flash = flashRef.current
    const particles = particlesRef.current
    if (!root || !ring || !target || !flash || !particles) return

    soundRef.current?.play()

    const rootRect = root.getBoundingClientRect()
    const ringRect = ring.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const dx = targetRect.left + targetRect.width / 2 - (ringRect.left + ringRect.width / 2)
    const dy = targetRect.top + targetRect.height / 2 - (ringRect.top + ringRect.height / 2)

    gsap.set(particles.children, {
      x: targetRect.left + targetRect.width / 2 - rootRect.left,
      y: targetRect.top + targetRect.height / 2 - rootRect.top,
      opacity: 0,
      scale: 0
    })

    const timeline = gsap.timeline({
      defaults: { ease: 'power4.out' },
      onComplete: () => {
        window.setTimeout(() => setState('hidden'), 450)
      }
    })

    timeline
      .to(ring, { x: `+=${dx}`, y: `+=${dy}`, scale: 0.74, rotation: -8, duration: 0.46 }, 0)
      .to(root, { backgroundColor: 'rgba(0,0,0,.96)', duration: 0.2 }, 0.2)
      .to(target, { boxShadow: '0 0 80px rgba(241,221,174,.95), 0 0 160px rgba(200,169,106,.38)', scale: 1.18, duration: 0.36 }, 0.22)
      .to(flash, { opacity: 1, duration: 0.08 }, 0.38)
      .to(flash, { opacity: 0, duration: 0.55 }, 0.48)
      .to(particles.children, {
        opacity: 1,
        scale: () => gsap.utils.random(0.55, 1.25),
        x: () => `+=${gsap.utils.random(-220, 220)}`,
        y: () => `+=${gsap.utils.random(-190, 190)}`,
        rotation: () => gsap.utils.random(-160, 160),
        stagger: 0.012,
        duration: 0.72
      }, 0.38)
      .to(particles.children, { opacity: 0, scale: 0, duration: 0.42, stagger: 0.006 }, 0.78)
      .to(root, { scale: 1.08, filter: 'blur(18px)', opacity: 0, duration: 1.08, ease: 'power3.inOut' }, 0.65)
  }

  if (state === 'hidden') return null

  return (
    <AnimatePresence>
      <motion.div
        ref={rootRef}
        className="fixed inset-0 z-[1900] overflow-hidden bg-[#fff7fa] text-[#3b2730]"
        initial={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0 }}
        aria-label="Experiência interativa de entrada BONITA"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(255,199,218,.62),transparent_34%),linear-gradient(120deg,#fff7fa_0%,#ffffff_48%,#ffe8f1_100%)]" />
        <div className="absolute inset-0 opacity-60 [background:linear-gradient(100deg,transparent_35%,rgba(255,255,255,.72)_48%,rgba(201,157,75,.14)_52%,transparent_62%)]" />

        <motion.button
          onClick={() => setState('hidden')}
          className="absolute right-4 top-4 z-30 rounded-full border border-white/70 bg-white/45 px-4 py-3 text-[.68rem] uppercase tracking-[.18em] text-[#694a58] shadow-[0_18px_60px_rgba(255,184,210,.22)] backdrop-blur-xl transition hover:border-gold hover:bg-white md:right-8 md:top-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          Skip intro
        </motion.button>

        <div className="relative z-10 grid min-h-screen items-center gap-6 px-4 py-20 md:grid-cols-[.88fr_1.12fr] md:px-12 lg:px-20">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: GOLD_EASE }}
          >
            <p className="mb-5 text-xs uppercase tracking-[.26em] text-gold">Private ritual / BONITA</p>
            <h1 className="font-serif text-[clamp(3rem,7vw,8rem)] leading-[.9] tracking-[-.06em] text-balance">Place the gold. Unlock BONITA.</h1>
            <p className="mt-7 max-w-md leading-8 text-[#765d69]">
              {isMobile ? 'Toque no anel para iniciar a entrada cinematográfica.' : 'Arraste o anel até o dedo para revelar a coleção em uma transição com luz, cristal e movimento.'}
            </p>
          </motion.div>

          <motion.div
            className="relative mx-auto h-[min(70vh,720px)] w-full max-w-[720px] perspective-1200"
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(14px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.2, duration: 1.1, ease: GOLD_EASE }}
          >
            <div className="absolute inset-0 rounded-[2.4rem] border border-white/70 bg-white/35 shadow-[0_40px_140px_rgba(255,184,210,.34)] backdrop-blur-sm" />
            <Image
              src="/assets/hand-intro.png"
              alt="Mão ultra realista para encaixe do anel"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
              className="rounded-[2.4rem] object-cover"
            />
            <div className="absolute inset-0 rounded-[2.4rem] bg-[radial-gradient(circle_at_57%_44%,transparent_0_9%,rgba(255,255,255,.05)_20%,rgba(255,231,240,.48)_82%)]" />

            <div
              ref={targetRef}
              className="ring-target absolute left-[52%] top-[47%] h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-champagne/45 bg-champagne/10 backdrop-blur-[2px] transition md:h-20 md:w-20"
              aria-hidden
            >
              <span className="absolute inset-2 rounded-full border border-gold/35" />
            </div>

            <motion.div
              ref={ringRef}
              onClick={() => isMobile && completeIntro()}
              className="absolute bottom-[8%] left-[10%] z-20 h-32 w-32 touch-none select-none md:h-44 md:w-44"
              style={{ filter: 'drop-shadow(0 22px 34px rgba(0,0,0,.5)) blur(.2px)' }}
              initial={{ y: 22, opacity: 0, rotate: -12 }}
              animate={{ y: 0, opacity: 1, rotate: -8 }}
              transition={{ delay: 0.65, duration: 0.85, ease: GOLD_EASE }}
              role="button"
              aria-label={isMobile ? 'Tocar para encaixar o anel' : 'Arraste o anel até o dedo'}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') completeIntro()
              }}
            >
              <Image src="/assets/ring-drag.png" alt="Anel de ouro arrastável" fill priority sizes="176px" className="object-contain" />
            </motion.div>
          </motion.div>
        </div>

        <div ref={particlesRef} className="pointer-events-none absolute inset-0 z-20">
          {Array.from({ length: 42 }).map((_, index) => (
            <span
              key={index}
              className="absolute h-1.5 w-1.5 rounded-full bg-champagne shadow-[0_0_18px_rgba(241,221,174,.9)]"
            />
          ))}
        </div>

        <div ref={flashRef} className="pointer-events-none absolute inset-0 z-40 opacity-0 bg-[radial-gradient(circle_at_55%_45%,#fff7d4_0%,#f1ddae_18%,rgba(200,169,106,.55)_34%,transparent_64%)]" />

        <div className="absolute bottom-6 left-1/2 z-30 w-[min(440px,88vw)] -translate-x-1/2 text-center text-[.68rem] uppercase tracking-[.18em] text-ivory/45">
          {state === 'success' ? 'Entering BONITA' : isMobile ? 'Tap ring to continue' : 'Drag the ring to the illuminated mark'}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
