import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PATH, UNIT_OF, unitById } from '../../core/content/path'
import { getLesson } from '../../core/content/lessons'
import type { PathNode, Unit } from '../../core/types'
import {
  currentNodeId, isCompleted, isUnlocked, NODE_INDEX_SAFE,
} from '../../core/engine/pathView'
import { useApp, useCalmMotion } from '../state'
import { Icon, Star, Sparkle, Lantern, Droplet } from '../icons/SirajIcons'
import { Siraj } from '../components/Siraj'
import { Button } from '../components/Button'
import { Burst } from '../components/Burst'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

const SKY: Record<Unit['tone'], string> = {
  gold: 'var(--yellow-soft)',
  ember: 'var(--orange-soft)',
  deep: 'var(--cream)',
  sand: 'var(--cream)',
}

/** how far a step sits off the centre line - a gentle wind, not a zigzag */
const dx = (i: number) => Math.round(Math.sin(i * 0.82) * 48)

export function Home({
  onStart, celebrate, onCelebrated,
}: {
  onStart: (nodeId: string) => void
  celebrate: string | null
  onCelebrated: () => void
}) {
  const { progress, dispatch } = useApp()
  const calm = useCalmMotion()
  const [picked, setPicked] = useState<PathNode | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)

  const current = currentNodeId(progress)
  const currentIdx = NODE_INDEX_SAFE(current)
  const unit = UNIT_OF.get(current) ?? unitById('u-intro')!

  // top of the list is the far future; bottom is where you stand
  const ordered = useMemo(() => [...PATH].reverse(), [])

  useLayoutEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  // the newly-lit step gets a beat of glory, then settles
  useEffect(() => {
    if (!celebrate) return
    sfx.unlock()
    haptic('unlock')
    const t = setTimeout(onCelebrated, 1400)
    return () => clearTimeout(t)
  }, [celebrate, onCelebrated])

  const openNode = (n: PathNode) => {
    primeAudio()
    if (n.soon) { sfx.wrong(); return }
    if (!isUnlocked(progress, n.id)) { sfx.wrong(); haptic('wrong'); return }
    sfx.tap()
    haptic('tap')
    if (n.kind === 'lesson') setPicked(n)
    else {
      // chests and trophies open straight away - they're a reward, not a task
      sfx.chest()
      haptic('win')
      dispatch({
        type: 'set',
        progress: {
          ...progress,
          xp: progress.xp + (n.kind === 'trophy' ? 60 : 30),
          completed: { ...progress.completed, [n.id]: { stars: 3, bestAccuracy: 1, at: Date.now() } },
        },
      })
    }
  }

  return (
    <div className="home" style={{ ['--sky-near' as string]: SKY[unit.tone] }}>
      <span className="sky" />

      <div className={`unitcard unitcard--${unit.tone}`}>
        <div style={{ flex: 1 }}>
          <div className="unitcard__kicker">الوحدة {toAr(unit.index + 1)}</div>
          <div className="unitcard__title">{unit.title}</div>
        </div>
        <span className="unitcard__ico"><Icon name={unit.icon} size={30} /></span>
      </div>

      <div className="stairwrap scroll" ref={scroller}>
        <div className="stair">
          {ordered.map((n) => {
            const i = NODE_INDEX_SAFE(n.id)
            const done = isCompleted(progress, n.id)
            const isCurrent = n.id === current
            const open = isUnlocked(progress, n.id)
            const ahead = Math.max(0, i - currentIdx)
            const lesson = n.lessonId ? getLesson(n.lessonId) : undefined
            const lighting = celebrate === n.id

            return (
              <div
                key={n.id}
                ref={isCurrent ? currentRef : undefined}
                className={[
                  'step',
                  done && 'step--done',
                  isCurrent && 'step--current',
                  open && 'step--open',
                  !open && 'step--locked',
                  n.soon && 'step--soon',
                  n.kind !== 'lesson' && 'step--chest',
                  lighting && 'step--lighting',
                ].filter(Boolean).join(' ')}
                style={{
                  ['--dx' as string]: `${dx(i)}px`,
                  ['--op' as string]: String(Math.max(0.3, 1 - ahead * 0.085)),
                  ['--sc' as string]: String(Math.max(0.78, 1 - ahead * 0.028)),
                }}
              >
                {isCurrent && !calm && <span className="step__ring" />}
                {lighting && <Burst count={18} flavour="gold" spread={130} />}

                <button
                  className="slab"
                  onClick={() => openNode(n)}
                  disabled={!open}
                  aria-label={lesson?.title ?? n.label ?? 'خطوة'}
                >
                  {n.kind === 'chest' ? (
                    <Sparkle size={24} />
                  ) : n.kind === 'trophy' ? (
                    <Lantern size={24} />
                  ) : lesson ? (
                    <Icon name={lesson.icon} size={24} />
                  ) : (
                    <Droplet size={24} />
                  )}

                  {done && n.kind === 'lesson' && (
                    <span className="slab__stars">
                      {Array.from({ length: progress.completed[n.id]?.stars ?? 1 }, (_, k) => (
                        <Star key={k} size={11} />
                      ))}
                    </span>
                  )}
                  {n.soon && <span className="slab__soon">قريبًا</span>}
                </button>

                {isCurrent && (
                  <>
                    <span className="step__cta">ابدأ</span>
                    <span className={`step__siraj${dx(i) > 0 ? ' step__siraj--flip' : ''}`}>
                      <Siraj mood="idle" size={76} flip={dx(i) > 0} />
                    </span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {picked && (
          <StepSheet
            node={picked}
            onClose={() => setPicked(null)}
            onStart={() => { const id = picked.id; setPicked(null); onStart(id) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ---------------- the step preview ---------------- */

function StepSheet({ node, onClose, onStart }: { node: PathNode; onClose: () => void; onStart: () => void }) {
  const lesson = node.lessonId ? getLesson(node.lessonId) : undefined
  const unit = UNIT_OF.get(node.id)
  const n = unit?.nodes.findIndex((x) => x.id === node.id) ?? 0
  const total = unit?.nodes.filter((x) => x.kind === 'lesson').length ?? 1

  return (
    <>
      <motion.div className="scrim" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
      <motion.div className="sheet"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
        <span className="sheet__grab" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <span className="klist__ico" style={{ width: 48, height: 48 }}>
            {lesson && <Icon name={lesson.icon} size={26} />}
          </span>
          <div style={{ flex: 1 }}>
            <div className="unitcard__kicker" style={{ color: 'var(--ink-3)' }}>
              الدرس {toAr(n + 1)} من {toAr(total)}
            </div>
            <h2 className="sheet__title" style={{ marginBottom: 0 }}>{lesson?.title ?? node.label}</h2>
          </div>
        </div>
        <p style={{ color: 'var(--ink-2)', fontWeight: 650, fontSize: '.94rem', margin: '4px 0 16px' }}>
          {lesson ? `${toAr(lesson.cards.length)} بطاقات تعلُّم، ثم ${toAr(lesson.exercises.length)} تمارين.` : ''}
        </p>
        <Button block onClick={onStart}>ابدأ الدرس</Button>
      </motion.div>
    </>
  )
}

/* Arabic-Indic digits, used for ordinals in copy (stats stay Western
   for scannability - see .num in global.css) */
export function toAr(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
