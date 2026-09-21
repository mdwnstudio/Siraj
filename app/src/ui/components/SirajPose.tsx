import { memo, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Mood } from './Siraj'

/* Drawn poses for the chat, one picture per state, so Siraj visibly
   listens, thinks and answers instead of one image tilting around.
   All five are cut from the same canvas (420x490), so they stack
   exactly and the character never changes size between poses.
   The CSS rigging from <Siraj> still runs on top of each pose. */
export type Pose = 'listen' | 'think' | 'answer' | 'celebrate' | 'oops'

const B = import.meta.env.BASE_URL
export const POSE_SRC: Record<Pose, string> = {
  listen: `${B}img/siraj-listen.webp`,
  think: `${B}img/siraj-think.webp`,
  answer: `${B}img/siraj-answer.webp`,
  celebrate: `${B}img/siraj-celebrate.webp`,
  oops: `${B}img/siraj-oops.webp`,
}

/** which existing rig animation each pose borrows */
const RIG: Record<Pose, Mood> = {
  listen: 'idle', think: 'think', answer: 'wave', celebrate: 'cheer', oops: 'sad',
}

/** fetch every pose up front, so the first swap is never a blank frame */
export function usePreloadPoses() {
  useEffect(() => {
    for (const src of Object.values(POSE_SRC)) {
      const img = new Image()
      img.src = src
    }
  }, [])
}

export const SirajPose = memo(function SirajPose({ pose, size = 80 }: { pose: Pose; size?: number }) {
  return (
    <div className="pose" style={{ width: size, height: Math.round((size * 490) / 420) }}>
      <AnimatePresence initial={false}>
        <motion.div key={pose} className="pose__frame"
          // a pure crossfade: the poses are stacked on one canvas, so any
          // scale here would read as the character changing size
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}>
          <div className={`siraj siraj--${RIG[pose]}`} style={{ width: '100%' }}>
            <img src={POSE_SRC[pose]} alt="" width={420} height={490} draggable={false} decoding="async" />
            <span className="siraj__shadow" aria-hidden />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
})
