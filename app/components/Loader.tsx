'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

function BonitaWordmark() {
  return (
    <span className="inline-flex items-center font-serif uppercase tracking-[.38em] text-[#3b2730]">
      BON
      <span className="relative inline-block px-[.04em]">
        <span className="absolute left-1/2 top-[-.85em] -translate-x-1/2 text-[.52em] leading-none text-gold drop-shadow-[0_0_12px_rgba(201,157,75,.72)]">◆</span>
        I
      </span>
      TA
    </span>
  )
}

export function Loader() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1050)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[2000] grid place-items-center bg-[#fff7fa]"
          initial={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(18px)', visibility: 'hidden' }}
          transition={{ duration: 0.9, ease: [0.19, 1, 0.22, 1] }}
          aria-hidden
        >
          <motion.div
            className="absolute h-[44vmin] w-[44vmin] rounded-full bg-[radial-gradient(circle,rgba(255,199,218,.72),transparent_64%)] blur-2xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.9, 0.55, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
          <motion.div
            className="translate-x-[.18em] text-[clamp(1.8rem,4vw,4.5rem)]"
            initial={{ y: 18, opacity: 0, filter: 'blur(14px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8 }}
          >
            <BonitaWordmark />
          </motion.div>
          <div className="absolute bottom-[18%] h-px w-[min(340px,62vw)] overflow-hidden bg-pink-200/70">
            <motion.span
              className="block h-full w-[45%] bg-gradient-to-r from-transparent via-gold to-transparent"
              animate={{ x: ['-120%', '260%'] }}
              transition={{ duration: 1.35, repeat: Infinity, ease: [0.19, 1, 0.22, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
