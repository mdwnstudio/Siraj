import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { UNIT_OF, unitById, unitText } from '../../core/content/path'
import { getLesson } from '../../core/content/lessons'
import type { PathNode, Progress, Unit } from '../../core/types'
import {
  currentNodeId, isCompleted, isUnlocked, NODE_INDEX_SAFE,
} from '../../core/engine/pathView'
import { useApp, useCalmMotion, useDarkTheme, useT } from '../state'
import { ordinal, type Lang } from '../../core/i18n'
import type { Strings } from '../strings'
import { Icon, Star, Sparkle, Lantern, Droplet } from '../icons/SirajIcons'
import { Siraj } from '../components/Siraj'
import {
  COMPOSITOR_CAMERA, focusStep, glideTime, glideTo, LANDSCAPE_UNITS, PathLandscape, PathSky, useLandscapeParallax,
} from '../components/PathLandscape'
import { Button } from '../components/Button'
import { Burst } from '../components/Burst'
import { useLayout } from '../useLayout'
import { useLite } from '../perf'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

/** how far a step sits off the centre line - a gentle wind, not a zigzag */
const dx = (i: number) => Math.round(Math.sin(i * 0.82) * 34)

/* On a wide screen the stair is drawn larger (zoom on .stairwrap, app.css
   14), so the road fills the column instead of standing phone-sized in the
   middle of it. The column is fitted to a phone-shaped view of the road:
   the camera works inside the zoom, so its maths is untouched. */
const ROAD_VIEW_H = 640
const ROAD_VIEW_W = 600
const ROAD_ZOOM_MAX = 1.9

/* The unit opener is its own chunk. It is fetched the moment a crossing
   starts, and shown only once it has arrived, a few seconds later. */
let openerChunk: typeof import('../components/UnitOpener') | undefined
const loadOpener = () => import('../components/UnitOpener').then((m) => (openerChunk = m))

/** Crossing into a new unit: hold on the step just finished, carry the
 *  camera up the road to the new one, then open the gate. */
type Crossing = { from: Unit; to: Unit; fromNode: string; node: string; hold: number; phase: 'hold' | 'glide' | 'open' }

export function Home({
  onStart, celebrate, onCelebrated, crossFrom = null, onCrossFrom,
}: {
  onStart: (nodeId: string) => void
  celebrate: string | null
  onCelebrated: () => void
  /** the step a lesson just finished, when the next one is in a new unit */
  crossFrom?: string | null
  onCrossFrom?: () => void
}) {
  const { progress, dispatch } = useApp()
  const t = useT()
  const lang = progress.language
  const calm = useCalmMotion()
  const lite = useLite()
  const phone = useLayout() === 'phone'
  const dark = useDarkTheme()
  const [picked, setPicked] = useState<PathNode | null>(null)
  const [reward, setReward] = useState<PathNode | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const sky = useRef<HTMLDivElement>(null)
  const homeRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLDivElement>(null)

  const current = currentNodeId(progress)
  const [shownUnit, setShownUnit] = useState<string | null>(null)
  const unit = (shownUnit && unitById(shownUnit)) || UNIT_OF.get(current) || unitById('u-intro')!

  // phones scroll the road natively and let the compositor run the camera
  const flat = phone || lite
  const native = flat && COMPOSITOR_CAMERA
  useLandscapeParallax(scroller, calm, { sky, onUnit: setShownUnit, lite, native })

  const [crossing, setCrossing] = useState<Crossing | null>(null)

  // before the first focus below, so the step is found at its final size
  useLayoutEffect(() => {
    const home = homeRef.current
    if (!home || phone) return
    let zoom = ''
    const fit = () => {
      const z = Math.min(home.clientHeight / ROAD_VIEW_H, home.clientWidth / ROAD_VIEW_W)
      const next = Math.min(ROAD_ZOOM_MAX, Math.max(1, z)).toFixed(2)
      if (next === zoom) return
      const first = !zoom
      zoom = next
      home.style.setProperty('--road-zoom', next)
      // a new zoom moves the road under the camera: stand at the current step again
      if (!first) focusStep(scroller.current, currentRef.current)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(home)
    return () => { observer.disconnect(); home.style.removeProperty('--road-zoom') }
  }, [phone])
  const [lit, setLit] = useState<string | null>(null)
  const [arrived, setArrived] = useState(0)
  const lastCurrent = useRef(current)

  // Stepping into a new unit used to snap the camera straight to it, and
  // the learner lost their place. Now the camera stays on the step they
  // just finished and climbs to the new unit, so the crossing is felt.
  useLayoutEffect(() => {
    const prev = lastCurrent.current
    lastCurrent.current = current
    const fromId = crossFrom ?? (prev !== current ? prev : null)
    if (crossFrom) onCrossFrom?.()
    const from = fromId ? UNIT_OF.get(fromId) : undefined
    const to = UNIT_OF.get(current)
    if (fromId && from && to && to.index > from.index && isCompleted(progress, fromId)) {
      const root = scroller.current
      focusStep(root, root?.querySelector<HTMLElement>(`[data-node="${fromId}"]`) ?? null)
      // a claimed chest shows its reward first; back from a lesson, a beat to find your feet
      setCrossing({ from, to, fromNode: fromId, node: current, hold: crossFrom ? 700 : 1250, phase: 'hold' })
      void loadOpener()
      return
    }
    focusStep(scroller.current, currentRef.current)
  }, [current])

  useEffect(() => {
    if (!crossing || crossing.phase === 'open') return
    if (crossing.phase === 'hold') {
      const t = setTimeout(() => setCrossing((c) => c && { ...c, phase: 'glide' }), crossing.hold)
      return () => clearTimeout(t)
    }
    const root = scroller.current
    const el = currentRef.current
    const ms = calm ? 0 : glideTime(root, el)
    if (ms) sfx.ascend((ms / 1000) * 0.85)
    let live = true
    const stop = glideTo(root, el, ms, () => {
      void loadOpener().then(() => { if (live) setCrossing((c) => c && { ...c, phase: 'open' }) })
    })
    return () => { live = false; stop() }
  }, [crossing, calm])

  // the banner changes hands as the camera passes into the new unit
  const bannerUnit = unit.id
  const gliding = crossing?.phase === 'glide'
  useEffect(() => {
    if (!gliding) return
    setArrived((n) => n + 1)
    sfx.tick(4)
    haptic('tap')
    // a change of unit only, not the start of the glide
  }, [bannerUnit])

  // Siraj waits beside the step just finished while the camera climbs, and
  // takes his place on the new step behind the gate, so he never jumps on screen
  const sirajAt = crossing && crossing.phase !== 'open' ? crossing.fromNode : current

  const opened = useCallback(() => {
    if (crossing) setLit(crossing.node)
    setCrossing(null)
  }, [crossing])

  // the new step lights once the gate has closed behind you
  useEffect(() => {
    if (!lit) return
    sfx.unlock()
    haptic('unlock')
    const t = setTimeout(() => setLit(null), 1400)
    return () => clearTimeout(t)
  }, [lit])

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
    <div className={`home${native ? ' home--native' : ''}`} ref={homeRef}>
      <PathSky skyRef={sky} />

      <Stair scroller={scroller} currentRef={currentRef} progress={progress} current={current} sirajAt={sirajAt}
        celebrate={celebrate ?? lit} onOpen={openNode} flat={flat} native={native} dark={dark} t={t} lang={lang} />

      {/* nothing on the stair takes a tap while the camera is climbing */}
      {crossing && crossing.phase !== 'open' && <div className="crossing-veil" aria-hidden />}

      <div key={arrived} className={`unitcard unitcard--${unit.tone}${arrived ? ' unitcard--arrive' : ''}`}>
        <div className="unitcard__main">
          <div className="unitcard__kicker">{t.unitKicker(unit.index + 1, unitText(unit, lang).subtitle)}</div>
          <div className="unitcard__title">{unitText(unit, lang).title}</div>
        </div>
        <div className="unitcard__side" aria-label={t.outOf(unitDone, unit.nodes.length)}>
          <Icon name={unit.icon} size={24} />
          <span className="num">{unitDone}/{unit.nodes.length}</span>
        </div>
      </div>

      <AnimatePresence>
        {crossing?.phase === 'open' && openerChunk && (
          <openerChunk.UnitOpener key="opener" from={crossing.from} to={crossing.to} onDone={opened} />
        )}
        {reward && (
          <motion.div className="reward-pop"
            initial={{ opacity: 0, scale: 0.55, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.82, y: -18 }}
            transition={{ type: 'spring', stiffness: 360, damping: 18 }}>
            {!calm && <Burst count={28} flavour="gold" spread={180} />}
            <span className="reward-pop__icon"><Sparkle size={38} /></span>
            <strong>{t.roadReward}</strong>
            <span className="reward-pop__xp"><span className="num">+{reward.kind === 'trophy' ? 60 : 30}</span> {t.points}</span>
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
const Stair = memo(function Stair({ scroller, currentRef, progress, current, sirajAt, celebrate, onOpen, flat, native, dark, t, lang }: {
  scroller: RefObject<HTMLDivElement | null>
  currentRef: RefObject<HTMLDivElement | null>
  progress: Progress
  current: string
  /** the step Siraj stands beside: the current one, except mid-crossing */
  sirajAt: string
  celebrate: string | null
  onOpen: (n: PathNode) => void
  flat: boolean
  native: boolean
  dark: boolean
  t: Strings
  lang: Lang
}) {
  return (
    <div className={`stairwrap scroll${native ? ' stairwrap--native' : ''}`} ref={scroller}>
      <div className="stage">
      <div className="stair">
        {LANDSCAPE_UNITS.map((landscapeUnit) => (
          <section className="path-unit" key={landscapeUnit.id} data-unit={landscapeUnit.id} aria-label={unitText(landscapeUnit, lang).title}>
            <PathLandscape unitId={landscapeUnit.id} flat={flat} dark={dark} />
            <div className="path-unit__caption" data-persp aria-hidden="true">
              <span>{ordinal(landscapeUnit.index, lang)}</span>{unitText(landscapeUnit, lang).title}
            </div>
            {[...landscapeUnit.nodes].reverse().map((n) => {
              const i = NODE_INDEX_SAFE(n.id)
              const done = isCompleted(progress, n.id)
              const isCurrent = n.id === current
              const open = isUnlocked(progress, n.id)
              const lesson = n.lessonId ? getLesson(n.lessonId, lang) : undefined
              const lighting = celebrate === n.id
              const rewardXp = n.kind === 'trophy' ? 60 : 30

              return (
                <div
                  key={n.id}
                  ref={isCurrent ? currentRef : undefined}
                  data-node={n.id}
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
                    aria-label={lesson?.title ?? (n.kind === 'chest' ? t.chest : n.kind === 'trophy' ? t.trophy : t.step)}
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
                        {done ? t.claimed : <>{t.reward} <b className="num">+{rewardXp}</b></>}
                      </span>
                    )}

                    {done && n.kind === 'lesson' && (
                      <span className="slab__stars">
                        {Array.from({ length: progress.completed[n.id]?.stars ?? 1 }, (_, k) => (
                          <Star key={k} size={11} />
                        ))}
                      </span>
                    )}
                    {n.soon && <span className="slab__soon">{t.soon}</span>}
                  </button>

                  {isCurrent && (
                    <span className="step__cta">{n.kind === 'lesson' ? t.start : t.openReward}</span>
                  )}
                  {n.id === sirajAt && (
                    <span className={`step__siraj${dx(i) < 0 ? ' step__siraj--flip' : ''}`}>
                      <span className="step__plinth" aria-hidden />
                      {/* the same drawing when he cheers (app.css hops it): swapping
                          to the other image mid-light made him visibly snap */}
                      <Siraj mood="idle" size={76} flip={dx(i) < 0} />
                    </span>
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
  const t = useT()
  const { progress } = useApp()
  const lesson = node.lessonId ? getLesson(node.lessonId, progress.language) : undefined
  const unit = UNIT_OF.get(node.id)
  const n = unit?.nodes.findIndex((x) => x.id === node.id) ?? 0
  const total = unit?.nodes.filter((x) => x.kind === 'lesson').length ?? 1
  // a phone gets a sheet from the bottom edge; a wide screen a card in the middle
  const phone = useLayout() === 'phone'
  const motionProps = phone
    ? { initial: { y: '100%' }, animate: { y: '0%' }, exit: { y: '100%' }, transition: { type: 'spring' as const, stiffness: 380, damping: 36 } }
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
              {t.lessonOf(n + 1, total)}
            </div>
            <h2 className="sheet__title" style={{ marginBottom: 0 }}>{lesson?.title ?? node.label}</h2>
          </div>
        </div>
        <p style={{ color: 'var(--ink-2)', fontWeight: 650, fontSize: '.94rem', margin: '4px 0 16px' }}>
          {lesson ? t.lessonShape(lesson.cards.length, lesson.exercises.length) : ''}
        </p>
        <Button block onClick={onStart}>{t.startLesson}</Button>
      </motion.div>
    </>
  )
}

/* Arabic-Indic digits, used for ordinals in copy (stats stay Western
   for scannability - see .num in global.css) */
export function toAr(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
