'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

export function Cursor() {
  const [hover, setHover] = useState(false)
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 180, damping: 24, mass: 0.35 })
  const y = useSpring(rawY, { stiffness: 180, damping: 24, mass: 0.35 })

  useEffect(() => {
    const move = (event: MouseEvent) => {
      rawX.set(event.clientX - 19)
      rawY.set(event.clientY - 19)
    }
    const over = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('a, button, input, [data-cursor]')) setHover(true)
    }
    const out = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('a, button, input, [data-cursor]')) setHover(false)
    }
    window.addEventListener('mousemove', move, { passive: true })
    document.addEventListener('mouseover', over)
    document.addEventListener('mouseout', out)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', over)
      document.removeEventListener('mouseout', out)
    }
  }, [rawX, rawY])

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[1000] hidden rounded-full border border-gold/70 bg-white/10 shadow-[0_0_28px_rgba(255,184,210,.5)] backdrop-blur-sm lg:block"
      style={{ x, y }}
      animate={{
        width: hover ? 76 : 38,
        height: hover ? 76 : 38,
        backgroundColor: hover ? 'rgba(255,199,218,.22)' : 'rgba(255,255,255,.08)',
        filter: hover ? 'blur(.2px)' : 'blur(0px)'
      }}
      transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
    />
  )
}
