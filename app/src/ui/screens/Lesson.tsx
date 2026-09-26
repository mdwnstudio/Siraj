import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import type { Card, CardArt, Lesson as LessonT, PrayerPose } from '../../core/types'
import type { Answer } from '../../core/engine/grading'
import { correctAnswerText, isCorrect } from '../../core/engine/grading'
import type { LessonOutcome } from '../../core/engine/progress'
import { getLesson } from '../../core/content/lessons'
import { UNIT_OF } from '../../core/content/path'
import { useApp, useCalmMotion } from '../state'
import { Icon, Sparkle, Droplet, Star, Crescent } from '../icons/SirajIcons'
import { Button, IconButton } from '../components/Button'
import { ProgressBar } from '../components/Bars'
import { Siraj } from '../components/Siraj'
import { Burst } from '../components/Burst'
import { ExerciseView, HostMood } from '../components/Exercises'
import { UnitScene } from '../components/PathLandscape'
import type { Mood } from '../components/Siraj'
import { AskSiraj } from './AskSiraj'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'
import { toAr } from './Home'

type Phase = 'warmup' | 'learn' | 'practice' | 'ask'

export function Lesson({
  nodeId, lessonId, onExit, onDone,
}: {
  nodeId: string
  lessonId: string
  onExit: () => void
  onDone: (o: LessonOutcome, lesson: LessonT) => void
}) {
  const lesson = getLesson(lessonId)!
  const unit = UNIT_OF.get(nodeId)
  const calm = useCalmMotion()
  const { progress, dispatch } = useApp()

  const [phase, setPhase] = useState<Phase>('warmup')
  const [cardAt, setCardAt] = useState(0)
  // which way the last card move went: 1 forward, -1 back. Sets the slide direction.
  const [dir, setDir] = useState(1)
  const [exAt, setExAt] = useState(0)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [verdict, setVerdict] = useState<null | 'good' | 'bad'>(null)
  const [combo, setCombo] = useState(0)
  const [oilPulse, setOilPulse] = useState(false)
  const correctCount = useRef(0)
  const oilLost = useRef(0)
  const started = useRef(Date.now())

  // the scene goes on the second fact card: quotes and lists have their own layout
  // (a posture card already is a picture, so it never takes the scene)
  const sceneCard = lesson.cards.map((c, i) => (c.kind === 'fact' && !isPose(c.art) ? i : -1)).filter((i) => i >= 0)[1] ?? -1
  const ex = lesson.exercises[exAt]
  const total = lesson.exercises.length

  // posture drawings are fetched during the warmup, so no card waits on its picture
  useEffect(() => {
    for (const c of lesson.cards) if (c.kind === 'fact' && isPose(c.art)) new Image().src = poseSrc(c.art.pose)
  }, [lesson])

  useEffect(() => {
    const t = setTimeout(() => { setPhase('learn'); started.current = Date.now() }, 900)
    return () => clearTimeout(t)
  }, [])

  /* ---- teaching ---- */
  const nextCard = () => {
    setDir(1)
    if (cardAt < lesson.cards.length - 1) setCardAt(cardAt + 1)
    else { sfx.swoosh(); setPhase('practice') }
  }
  const prevCard = () => {
    if (cardAt === 0) return
    setDir(-1)
    setCardAt(cardAt - 1)
  }

  /* a sideways flick turns the card, the way a page turns in an Arabic book:
     the next card waits on the left, so dragging right (toward the end of the
     line) moves forward and dragging left goes back. The deck follows the
     finger one to one, on transform only; a committed flick leaves the deck
     where the finger let go and the exit carries it on from there, so nothing
     jumps. Vertical drags stay scrolls. */
  const drag = useRef<{
    x: number; y: number; id: number; el: HTMLElement
    axis: 0 | 'x' | 'y'; dx: number; v: number; lx: number; lt: number
  } | null>(null)
  // the card on its way out keeps its old handlers; it must not take a new flick
  const live = useRef('')
  live.current = phase === 'learn' ? `c${cardAt}` : ''
  const onCardDown = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' || !e.isPrimary || live.current !== `c${cardAt}`) return
    const el = e.currentTarget.firstElementChild as HTMLElement | null
    if (!el) return
    el.style.transition = ''
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, el, axis: 0, dx: 0, v: 0, lx: e.clientX, lt: e.timeStamp }
  }
  const onCardMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = e.clientX - d.x
    if (!d.axis) {
      const dy = e.clientY - d.y
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (d.axis === 'x') {
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* pointer already gone */ }
      }
    }
    if (d.axis !== 'x') return
    const dt = e.timeStamp - d.lt
    if (dt > 0) d.v = 0.8 * ((e.clientX - d.lx) / dt) + 0.2 * d.v
    d.lx = e.clientX
    d.lt = e.timeStamp
    d.dx = dx
    // nothing before the first card: the deck gives a little, then resists
    const off = dx < 0 && cardAt === 0 ? dx * 0.25 : dx
    d.el.style.transform = `translate3d(${off}px,0,0)`
  }
  const settleDeck = (el: HTMLElement) => {
    el.style.transition = 'transform 280ms cubic-bezier(0.23, 1, 0.32, 1)'
    el.style.transform = ''
  }
  const onCardUp = (e: React.PointerEvent<HTMLElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    if (d.axis !== 'x') return
    const fwd = d.dx > 0
    const flung = Math.abs(d.v) > 0.45 && Math.abs(d.dx) > 24 && d.v > 0 === fwd
    const far = Math.abs(d.dx) > d.el.offsetWidth * 0.22
    if (e.type === 'pointercancel' || !(flung || far) || (!fwd && cardAt === 0)) {
      settleDeck(d.el)
      return
    }
    primeAudio()
    sfx.tap()
    if (fwd) nextCard()
    else prevCard()
  }

  /* ---- practice ---- */
  const check = () => {
    if (!ex) return
    const ok = isCorrect(ex, answer)
    settle(ok)
  }

  const settle = (ok: boolean) => {
    if (ok) {
      correctCount.current += 1
      const c = combo + 1
      setCombo(c)
      sfx.correct(c - 1)
      haptic('correct')
    } else {
      setCombo(0)
      oilLost.current += 1
      sfx.wrong()
      haptic('wrong')
      setOilPulse(true)
      setTimeout(() => setOilPulse(false), 520)
      dispatch({ type: 'set', progress: { ...progress, oil: Math.max(0, progress.oil - 1), oilUpdatedAt: Date.now() } })
    }
    setVerdict(ok ? 'good' : 'bad')
  }

  const advance = () => {
    setVerdict(null)
    setAnswer(null)
    if (exAt < total - 1) setExAt(exAt + 1)
    else { sfx.swoosh(); setPhase('ask') }
  }

  const finish = () => {
    onDone(
      {
        nodeId,
        xp: lesson.xp + Math.round((correctCount.current / Math.max(1, total)) * 10),
        total,
        correct: correctCount.current,
        oilLost: oilLost.current,
        seconds: Math.max(1, Math.round((Date.now() - started.current) / 1000)),
      },
      lesson,
    )
  }

  const hostMood: Mood = verdict === 'good' ? 'cheer' : verdict === 'bad' ? 'sad' : answer ? 'think' : 'idle'

  const canCheck =
    ex && (ex.kind === 'match' || ex.kind === 'sort' ? false : answer !== null)

  /* Enter does whatever the one big button would, so a keyboard learner can
     run a whole lesson without the mouse. Not while typing to Siraj. */
  const primary = useRef<() => void>(() => {})
  const cardKey = useRef<(d: number) => void>(() => {})
  cardKey.current = (d) => {
    if (phase !== 'learn') return
    if (d > 0) nextCard()
    else prevCard()
  }
  primary.current = () => {
    if (verdict) advance()
    else if (phase === 'learn') nextCard()
    else if (phase === 'practice' && canCheck) check()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      // arrows point at the card to go to: in RTL the next one waits on the left
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.repeat) {
        cardKey.current(e.key === 'ArrowLeft' ? 1 : -1)
        return
      }
      if (e.key !== 'Enter' || e.repeat || e.isComposing) return
      // a focused tile would also "click" on Enter; the lesson owns this key
      e.preventDefault()
      primeAudio()
      primary.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const progressValue =
    phase === 'learn'
      ? ((cardAt + 1) / lesson.cards.length) * 0.3
      : phase === 'practice'
        ? 0.3 + ((exAt + (verdict ? 1 : 0)) / total) * 0.65
        : 1

  return (
    <div className={`lesson${calm ? ' calm' : ''}`}>
      <AnimatePresence>
        {phase === 'warmup' && (
          <motion.div className="warmup" exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.35 }}>
            <div className="warmup__inner">
              <Siraj mood="wave" size={150} rim />
              <div className="warmup__title">{lesson.title}</div>
              <div className="warmup__ring" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lesson__top">
        <IconButton label="إغلاق" onClick={onExit}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </IconButton>
        <ProgressBar value={progressValue} tone={phase === 'learn' ? 'gold' : 'good'} />
        <div className={`lesson__oil${progress.oil <= 1 ? ' is-low' : ''}${oilPulse ? ' is-draining' : ''}`}>
          <Droplet size={21} />
          <span className="num">{progress.oil}</span>
        </div>
      </div>

      <div className="lesson__body">
        {/* custom reaches the card already leaving, so it exits the way the
            learner is going now, not the way they came in */}
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          {/* ---------------- تعلّم ---------------- */}
          {phase === 'learn' && (
            <motion.div key={`c${cardAt}`} className="cardstage" custom={dir} variants={cardTurn}
              initial="enter" animate="shown" exit="leave"
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              onPointerDown={onCardDown} onPointerMove={onCardMove} onPointerUp={onCardUp}
              onPointerCancel={onCardUp}>
              <div className="cardstage__deck">
                <CardView card={lesson.cards[cardAt]} unitId={unit?.id ?? 'u-intro'} withScene={cardAt === sceneCard} />
                <div className="dots">
                  {lesson.cards.map((_, i) => (
                    <span key={i} className={`dots__d${i === cardAt ? ' is-on' : i < cardAt ? ' is-past' : ''}`} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ---------------- رسّخ ---------------- */}
          {phase === 'practice' && ex && (
            <motion.div key={`e${exAt}`} className="ex"
              initial={{ opacity: 0, x: -34 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 34 }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>
              <span className="ex__kicker">
                <Star size={13} /> تمرين {toAr(exAt + 1)} من {toAr(total)}
              </span>
              <HostMood.Provider value={hostMood}>
                <ExerciseView
                  ex={ex}
                  locked={verdict !== null}
                  revealed={verdict !== null}
                  onChange={setAnswer}
                  onAutoSubmit={(a) => { setAnswer(a); settle(isCorrect(ex, a)) }}
                />
              </HostMood.Provider>
              <div style={{ height: 140 }} />
            </motion.div>
          )}

          {/* ---------------- اسأل سراج ---------------- */}
          {phase === 'ask' && (
            <motion.div key="ask" className="ask"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}>
              <AskSiraj lesson={lesson} unitTitle={unit?.title ?? ''} onFinish={finish} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* the run-of-right-answers flag */}
        <AnimatePresence>
          {combo >= 2 && verdict === 'good' && !calm && (
            <motion.div className="combo"
              initial={{ y: -40, opacity: 0, rotate: -8 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 460, damping: 22 }}>
              <Sparkle size={15} /> {toAr(combo)} متتالية
            </motion.div>
          )}
        </AnimatePresence>

        {/* verdict banner */}
        <AnimatePresence>
          {verdict && (
            <motion.div className={`verdict verdict--${verdict}`}
              initial={{ y: '110%' }} animate={{ y: 0 }} exit={{ y: '110%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}>
              {verdict === 'good' && !calm && <Burst count={14} flavour="mixed" spread={150} />}
              <div className="verdict__head">
                <span className="verdict__badge">
                  {verdict === 'good' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5 L9.5 18 L20 6.5" /></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round"><path d="M6 6 L18 18 M18 6 L6 18" /></svg>
                  )}
                </span>
                <span className="verdict__title">{verdict === 'good' ? pick(GOOD, exAt) : 'ليست بعيدة'}</span>
              </div>
              <p className="verdict__text">
                {verdict === 'bad' && (
                  <>الصحيح: <span className="verdict__answer">{correctAnswerText(ex!)}</span><br /></>
                )}
                {'explain' in ex! && ex!.explain}
              </p>
              <Button block tone={verdict === 'good' ? 'good' : 'danger'} onClick={advance}>
                {exAt < total - 1 ? 'متابعة' : 'أنهِ التمارين'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* footer action - hidden while a verdict is showing */}
      {!verdict && phase !== 'ask' && phase !== 'warmup' && (
        <div className="lesson__foot">
          {phase === 'learn' ? (
            <div className="learnbar">
              {/* back: a small square beside the big button, first in RTL so it sits on the right */}
              <button className="backbtn" aria-label="البطاقة السابقة" disabled={cardAt === 0}
                onPointerDown={() => { primeAudio(); sfx.tap(); haptic('tap') }} onClick={prevCard}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
                  <path d="M9 5 L16 12 L9 19" />
                </svg>
              </button>
              <Button block tone="gold" onClick={nextCard}>
                {cardAt < lesson.cards.length - 1 ? 'التالي' : 'لنتدرّب'}
              </Button>
            </div>
          ) : ex && (ex.kind === 'match' || ex.kind === 'sort') ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontWeight: 700, fontSize: '.9rem', padding: '14px 0' }}>
              {ex.kind === 'match' ? 'اختر من كل عمودٍ ما يقابله' : 'لكل بطاقة: اضغط على الجواب الصحيح'}
            </p>
          ) : (
            <Button block disabled={!canCheck} onClick={check}>تحقّق</Button>
          )}
        </div>
      )}
    </div>
  )
}

/* RTL: going forward, the card leaves to the right and the next one comes
   in from the left; back reverses both, so the motion always matches the
   finger. The exit is quicker and eases in, so a flicked card keeps its
   speed on the way out. */
const cardTurn = {
  enter: (d: number) => ({ opacity: 0, x: -40 * d }),
  shown: { opacity: 1, x: 0 },
  leave: (d: number) => ({ opacity: 0, x: 48 * d, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const } }),
}

const GOOD = ['أحسنت!', 'ممتاز!', 'بالضبط!', 'رائع!', 'أصبتَ!', 'تمامًا!']
const pick = (a: string[], i: number) => a[i % a.length]

const POSE_DIR = `${import.meta.env.BASE_URL}img/salah/`
const poseSrc = (pose: PrayerPose) => `${POSE_DIR}${pose}.webp`
function isPose(art: CardArt | undefined): art is { pose: PrayerPose } {
  return typeof art === 'object' && 'pose' in art
}

/* ---------------- a teaching card ---------------- */

function CardView({ card, unitId, withScene }: { card: Card; unitId: string; withScene: boolean }) {
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [card.id])

  if (card.kind === 'quote') {
    return (
      <div className="kcard">
        <span className="kcard__kicker">
          {card.of === 'ayah' ? <><Crescent size={13} /> من القرآن</> : <><Star size={13} /> من السنّة</>}
        </span>
        <motion.div className={`quote quote--${card.of}`}
          initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}>
          <span className="quote__corner quote__corner--a"><Sparkle size={17} /></span>
          <span className="quote__corner quote__corner--b"><Sparkle size={17} /></span>
          <p className="quote__text">{card.text}</p>
          <p className="quote__src">﴿ {card.source} ﴾</p>
        </motion.div>
        {card.note && <p className="quote__note" style={{ textAlign: 'center' }}>{card.note}</p>}
      </div>
    )
  }

  if (card.kind === 'list') {
    return (
      <div className="kcard">
        <h2 className="kcard__title">{card.title}</h2>
        <div className="klist">
          {card.items.map((it, i) => (
            <div className="klist__row" key={i} style={{ animationDelay: `${i * 70}ms` }}>
              {it.icon && <span className="klist__ico"><Icon name={it.icon} size={20} /></span>}
              <div>
                <div className="klist__label">{it.label}</div>
                {it.note && <div className="klist__note">{it.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // fact
  const body = card.term ? splitTerm(card.body, card.term.word) : null
  return (
    <div className="kcard">
      {/* one card per lesson sets the scene: the unit's world, with the card's art standing in it */}
      {withScene ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}>
          <UnitScene unitId={unitId}>
            {card.art === 'siraj' || card.art === 'siraj-wave' ? (
              <Siraj mood={card.art === 'siraj-wave' ? 'wave' : 'idle'} size={96} />
            ) : card.art && 'icon' in card.art ? (
              <span className="scene__medal"><Icon name={card.art.icon} size={34} /></span>
            ) : null}
          </UnitScene>
        </motion.div>
      ) : card.art && (
        <motion.div style={{ display: 'flex', justifyContent: 'center' }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}>
          {card.art === 'siraj' || card.art === 'siraj-wave' ? (
            <Siraj mood={card.art === 'siraj-wave' ? 'wave' : 'idle'} size={132} />
          ) : 'pose' in card.art ? (
            <img className="pose" src={poseSrc(card.art.pose)} alt="" width={356} height={410} decoding="async" />
          ) : (
            <span style={{ color: 'var(--orange)', background: 'var(--orange-soft)', padding: 22, borderRadius: 28, display: 'grid' }}>
              <Icon name={card.art.icon} size={52} />
            </span>
          )}
        </motion.div>
      )}
      {card.title && <h2 className="kcard__title">{card.title}</h2>}
      <p className="kcard__body">
        {body ? (
          <>
            {body[0]}
            {termBtn(body[1])}
            {body[2]}
          </>
        ) : (
          card.body
        )}
      </p>
      {/* a term the body never spells out still gets its word to tap */}
      {card.term && !body && <div className="kcard__term">{termBtn(card.term.word)}</div>}
      {card.term && (
        /* the meaning and the hint share one slot sized to the meaning, and only
           cross-fade: nothing below the body ever grows, shrinks or jumps */
        <div className="termslot">
          <motion.span className="termpop" aria-hidden={!open} initial={false}
            animate={{ opacity: open ? 1 : 0, y: open ? 0 : -8 }}
            transition={{ duration: open ? 0.24 : 0.18, ease: open ? [0.23, 1, 0.32, 1] : [0.4, 0, 1, 1] }}>
            {card.term.meaning}
          </motion.span>
          <motion.p className="termhint" aria-hidden={open} initial={false}
            animate={{ opacity: open ? 0 : 1 }}
            transition={{ duration: 0.18, delay: open ? 0 : 0.1 }}>
            اضغط على الكلمة المُظلّلة لمعناها
          </motion.p>
        </div>
      )}
    </div>
  )

  function termBtn(text: string) {
    return (
      <button className="term" aria-expanded={open} onClick={() => { primeAudio(); sfx.select(); setOpen(!open) }}>
        {text}
      </button>
    )
  }
}

/* Arabic letters and harakat, minus Arabic punctuation (، ؛ ؟ ٪…) */
const WORD_CHAR = /[\u0621-\u065F\u0670-\u06D3\u06D5-\u06ED]/

/** Split around the term, stretched to the whole written word. If the highlight
 * stopped at «مُسلِم» inside «مُسلِمًا», the ending would sit in another element
 * and the letters could not join across it. */
function splitTerm(body: string, word: string): [string, string, string] | null {
  let i = body.indexOf(word)
  // «الهلال» written as «هلاله»: try the word without its article
  if (i < 0 && word.startsWith('ال') && word.length > 4) {
    word = word.slice(2)
    i = body.indexOf(word)
  }
  if (i < 0) return null
  let a = i
  let b = i + word.length
  while (a > 0 && WORD_CHAR.test(body[a - 1])) a--
  while (b < body.length && WORD_CHAR.test(body[b])) b++
  return [body.slice(0, a), body.slice(a, b), body.slice(b)]
}
