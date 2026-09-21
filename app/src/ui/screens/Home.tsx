import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { UNIT_OF, unitById } from '../../core/content/path'
import { getLesson } from '../../core/content/lessons'
import type { PathNode, Progress } from '../../core/types'
import {
  currentNodeId, isCompleted, isUnlocked, NODE_INDEX_SAFE,
} from '../../core/engine/pathView'
import { useApp, useCalmMotion, useDarkTheme } from '../state'
import { Icon, Star, Sparkle, Lantern, Droplet } from '../icons/SirajIcons'
import { Siraj } from '../components/Siraj'
import { focusStep, LANDSCAPE_UNITS, PathLandscape, PathSky, useLandscapeParallax } from '../components/PathLandscape'
import { Button } from '../components/Button'
import { Burst } from '../components/Burst'
import { useLayout } from '../useLayout'
import { useLite } from '../perf'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

/** how far a step sits off the centre line - a gentle wind, not a zigzag */
const dx = (i: number) => Math.round(Math.sin(i * 0.82) * 34)

export function Home({
  onStart, celebrate, onCelebrated,
}: {
  onStart: (nodeId: string) => void
  celebrate: string | null
  onCelebrated: () => void
}) {
  const { progress, dispatch } = useApp()
  const calm = useCalmMotion()
  const lite = useLite()
  const phone = useLayout() === 'phone'
  const dark = useDarkTheme()
  const [picked, setPicked] = useState<PathNode | null>(null)
  const [reward, setReward] = useState<PathNode | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const sky = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)

  const current = currentNodeId(progress)
  const [shownUnit, setShownUnit] = useState<string | null>(null)
  const unit = (shownUnit && unitById(shownUnit)) || UNIT_OF.get(current) || unitById('u-intro')!

  useLandscapeParallax(scroller, calm, { sky, onUnit: setShownUnit, lite })

  useLayoutEffect(() => {
    focusStep(scroller.current, currentRef.current)
  }, [current])

  // the newly-lit step gets a beat of glory, then settles
  useEffect(() => {
    if (!celebrate) return
    sfx.unlock()
    haptic('unlock')
    const t = setTimeout(onCelebrated, 1400)
    return () => clearTimeout(t)
  }, [celebrate, onCelebrated])

  const openNodeNow = (n: PathNode) => {
    primeAudio()
    if (n.soon) { sfx.wrong(); return }
    if (!isUnlocked(progress, n.id)) { sfx.wrong(); haptic('wrong'); return }
    if (n.kind !== 'lesson' && isCompleted(progress, n.id)) { sfx.tap(); return }
    sfx.tap()
    haptic('tap')
    if (n.kind === 'lesson') setPicked(n)
    else {
      sfx.chest()
      haptic('win')
      dispatch({ type: 'claim-reward', nodeId: n.id })
      setReward(n)
    }
  }

  // one stable handler for the memoised stair, always reading fresh progress
  const openLatest = useRef(openNodeNow)
  openLatest.current = openNodeNow
  const openNode = useCallback((n: PathNode) => openLatest.current(n), [])

  useEffect(() => {
    if (!reward) return
    const t = setTimeout(() => setReward(null), 1450)
    return () => clearTimeout(t)
  }, [reward])

  const unitDone = unit.nodes.filter((n) => isCompleted(progress, n.id)).length

  return (
    <div className="home">
      <PathSky skyRef={sky} />

      <Stair scroller={scroller} currentRef={currentRef} progress={progress} current={current}
        celebrate={celebrate} onOpen={openNode} flat={phone || lite} dark={dark} />

      <div className={`unitcard unitcard--${unit.tone}`}>
        <div className="unitcard__main">
          <div className="unitcard__kicker">الوحدة {toAr(unit.index + 1)} · {unit.subtitle}</div>
          <div className="unitcard__title">{unit.title}</div>
        </div>
        <div className="unitcard__side" aria-label={`${unitDone} من ${unit.nodes.length}`}>
          <Icon name={unit.icon} size={24} />
          <span className="num">{unitDone}/{unit.nodes.length}</span>
        </div>
      </div>

      <AnimatePresence>
        {reward && (
          <motion.div className="reward-pop"
            initial={{ opacity: 0, scale: 0.55, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: -18 }}
            transition={{ type: 'spring', stiffness: 360, damping: 18 }}>
            {!calm && <Burst count={28} flavour="gold" spread={180} />}
            <span className="reward-pop__icon"><Sparkle size={38} /></span>
            <strong>مكافأة الطريق</strong>
            <span className="reward-pop__xp"><span className="num">+{reward.kind === 'trophy' ? 60 : 30}</span> نقطة</span>
          </motion.div>
        )}
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

/* ---------------- the stair itself ----------------
   Memoised: the unit banner changes as you scroll, and that must not
   re-render thirty steps in the middle of a flick. */
const Stair = memo(function Stair({ scroller, currentRef, progress, current, celebrate, onOpen, flat, dark }: {
  scroller: RefObject<HTMLDivElement | null>
  currentRef: RefObject<HTMLDivElement | null>
  progress: Progress
  current: string
  celebrate: string | null
  onOpen: (n: PathNode) => void
  flat: boolean
  dark: boolean
}) {
  return (
    <div className="stairwrap scroll" ref={scroller}>
      <div className="stage">
      <div className="stair">
        {LANDSCAPE_UNITS.map((landscapeUnit) => (
          <section className="path-unit" key={landscapeUnit.id} data-unit={landscapeUnit.id} aria-label={landscapeUnit.title}>
            <PathLandscape unitId={landscapeUnit.id} flat={flat} dark={dark} />
            <div className="path-unit__caption" data-persp aria-hidden="true">
              <span>{toAr(landscapeUnit.index)}</span>{landscapeUnit.title}
            </div>
            {[...landscapeUnit.nodes].reverse().map((n) => {
              const i = NODE_INDEX_SAFE(n.id)
              const done = isCompleted(progress, n.id)
              const isCurrent = n.id === current
              const open = isUnlocked(progress, n.id)
              const lesson = n.lessonId ? getLesson(n.lessonId) : undefined
              const lighting = celebrate === n.id
              const rewardXp = n.kind === 'trophy' ? 60 : 30

              return (
                <div
                  key={n.id}
                  ref={isCurrent ? currentRef : undefined}
                  data-persp
                  data-dx={dx(i)}
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
                    // higher treads sit in front, so each one's shadow falls on the tread below
                    zIndex: i + 1,
                  }}
                >
                  {lighting && <Burst count={18} flavour="gold" spread={130} />}

                  <button
                    className="slab"
                    onClick={() => onOpen(n)}
                    disabled={!open || (done && n.kind !== 'lesson')}
                    aria-label={lesson?.title ?? n.label ?? 'خطوة'}
                  >
                    <span className="slab__medal">
                      {n.kind === 'chest' ? (
                        <Sparkle size={24} />
                      ) : n.kind === 'trophy' ? (
                        <Lantern size={24} />
                      ) : lesson ? (
                        <Icon name={lesson.icon} size={24} />
                      ) : (
                        <Droplet size={24} />
                      )}
                    </span>

                    {n.kind !== 'lesson' && (
                      <span className="slab__reward">
                        {done ? 'تم الاستلام' : <>مكافأة <b className="num">+{rewardXp}</b></>}
                      </span>
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
                      <span className="step__cta">{n.kind === 'lesson' ? 'ابدأ' : 'افتح المكافأة'}</span>
                      <span className={`step__siraj${dx(i) < 0 ? ' step__siraj--flip' : ''}`}>
                        <span className="step__plinth" aria-hidden />
                        <Siraj mood="idle" size={76} flip={dx(i) < 0} />
                      </span>
                    </>
                  )}
                </div>
              )
            })}
          </section>
        ))}
      </div>
      </div>
      <div className="stair-spacer" aria-hidden />
    </div>
  )
})

/* ---------------- the step preview ---------------- */

function StepSheet({ node, onClose, onStart }: { node: PathNode; onClose: () => void; onStart: () => void }) {
  const lesson = node.lessonId ? getLesson(node.lessonId) : undefined
  const unit = UNIT_OF.get(node.id)
  const n = unit?.nodes.findIndex((x) => x.id === node.id) ?? 0
  const total = unit?.nodes.filter((x) => x.kind === 'lesson').length ?? 1
  // a phone gets a sheet from the bottom edge; a wide screen a card in the middle
  const phone = useLayout() === 'phone'
  const motionProps = phone
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring' as const, stiffness: 380, damping: 36 } }
    : { initial: { opacity: 0, scale: 0.92, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 8 }, transition: { type: 'spring' as const, stiffness: 420, damping: 30 } }

  return (
    <>
      <motion.div className="scrim" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
      <motion.div className="sheet" {...motionProps}>
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
