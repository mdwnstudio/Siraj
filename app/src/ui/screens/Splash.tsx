import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lantern } from '../icons/SirajIcons'

/* The brand opening. Held just long enough to read, never longer.
   The yellow here matches the inlined #FEBD01 in index.html, so the
   handoff from "page loading" to "app running" is seamless. */
export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1550)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="splash"
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.45, ease: [0.32, 0, 0.67, 0] }}
    >
      <span className="splash__glow" />
      <div className="splash__mark">
        <span className="splash__lamp"><Lantern size={120} /></span>
        <span className="splash__word">سراج</span>
      </div>
    </motion.div>
  )
}
