import { useEffect } from 'react'
import { motion } from 'framer-motion'

const B = import.meta.env.BASE_URL
const CHARACTER = `${B}img/siraj-splash.webp`
const WORDMARK = `${B}img/siraj-wordmark-ar.svg`

/* The brand opening. The artwork and wordmark come directly from the
   visual identity, and the background matches the source image exactly. */
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
      <div className="splash__mark">
        <img
          className="splash__character"
          src={CHARACTER}
          alt=""
          width="900"
          height="900"
          fetchPriority="high"
        />
        <img
          className="splash__wordmark"
          src={WORDMARK}
          alt="سراج"
          width="475"
          height="238"
        />
      </div>
    </motion.div>
  )
}
