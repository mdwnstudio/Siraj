import { useEffect, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import type { Gift } from '../../core/content/gifts'
import { useApp, useCalmMotion, useLang, useT } from '../state'
import { Sparkle } from '../icons/SirajIcons'
import { Button } from './Button'
import { Burst } from './Burst'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

/* A gift on the stair. Back from a lesson that carries one, a wrapped box
   waits; a tap throws its lid off and what was inside (a video) takes its
   place. Opened once, it plays again from the step's sheet, straight to
   the video. Its own chunk: most visits to the stair never need it.
   Every moving part is transform or opacity. */
export function GiftPop({ gift, unwrapped = false, onClose }: { gift: Gift; unwrapped?: boolean; onClose: () => void }) {
  const t = useT()
  const lang = useLang()
  const calm = useCalmMotion()
  const { dispatch } = useApp()
  // wrapped -> the lid flies -> the video
  const [stage, setStage] = useState<'wrapped' | 'opening' | 'open'>(unwrapped ? 'open' : 'wrapped')

  useEffect(() => {
    if (!unwrapped) { sfx.chirp(); haptic('tap') }
  }, [unwrapped])

  const open = () => {
    if (stage !== 'wrapped') return
    primeAudio()
    sfx.chest()
    haptic('win')
    dispatch({ type: 'open-gift', id: gift.id })
    setStage('opening')
    setTimeout(() => { setStage('open'); sfx.fanfare() }, calm ? 0 : 650)
  }

  // Enter does what the one big button does
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return
      e.preventDefault()
      if (stage === 'wrapped') open()
      else if (stage === 'open') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <motion.div className="scrim" onClick={stage === 'open' ? onClose : undefined}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
      <motion.div className={`giftpop${stage === 'open' ? ' giftpop--open' : ''}`} role="dialog" aria-modal="true"
        aria-label={stage === 'open' ? gift.title[lang] : t.giftKicker}
        initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
        <AnimatePresence mode="wait" initial={false}>
          {stage !== 'open' ? (
            <motion.div key="box" className="giftpop__wrap" exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
              <span className="giftpop__kicker"><Sparkle size={14} /> {t.giftKicker}</span>
              <button className={`giftbox${stage === 'opening' ? ' is-opening' : ''}${calm ? '' : ' is-alive'}`}
                onClick={open} aria-label={t.giftOpen}>
                {stage === 'opening' && !calm && <Burst count={30} flavour="gold" spread={170} />}
                <svg viewBox="0 0 120 120" width="150" height="150" aria-hidden focusable="false">
                  <g className="giftbox__body">
                    <rect x="22" y="56" width="76" height="52" rx="7" className="giftbox__paper" />
                    <rect x="22" y="56" width="76" height="9" className="giftbox__shade" />
                    <rect x="54" y="56" width="12" height="52" className="giftbox__ribbon" />
                  </g>
                  <g className="giftbox__lid">
                    <path d="M60 36 C48 18 30 22 36 32 C40 38 52 37 60 36 Z" className="giftbox__ribbon" />
                    <path d="M60 36 C72 18 90 22 84 32 C80 38 68 37 60 36 Z" className="giftbox__ribbon" />
                    <rect x="14" y="34" width="92" height="24" rx="7" className="giftbox__paper giftbox__paper--lit" />
                    <rect x="54" y="34" width="12" height="24" className="giftbox__ribbon" />
                  </g>
                </svg>
              </button>
              <p className="giftpop__lead">{t.giftEarned}</p>
              <Button block tone="gold" onClick={open} disabled={stage !== 'wrapped'}>{t.giftOpen}</Button>
            </motion.div>
          ) : (
            <motion.div key="video" className="giftpop__inside"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
              <h2 className="giftpop__title">{gift.title[lang]}</h2>
              <div className="giftpop__video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${gift.youtube}?rel=0&playsinline=1&hl=${lang}`}
                  title={gift.title[lang]}
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
              <p className="giftpop__note">{gift.note[lang]}</p>
              <Button block onClick={onClose}>{t.continue}</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
