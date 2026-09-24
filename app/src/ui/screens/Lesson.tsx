import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import type { Card, Lesson as LessonT } from '../../core/types'
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
  const [exAt, setExAt] = useState(0)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [verdict, setVerdict] = useState<null | 'good' | 'bad'>(null)
  const [combo, setCombo] = useState(0)
  const [oilPulse, setOilPulse] = useState(false)
  const correctCount = useRef(0)
  const oilLost = useRef(0)
  const started = useRef(Date.now())

  // the scene goes on the second fact card: quotes and lists have their own layout
  const sceneCard = lesson.cards.map((c, i) => (c.kind === 'fact' ? i : -1)).filter((i) => i >= 0)[1] ?? -1
  const ex = lesson.exercises[exAt]
  const total = lesson.exercises.length

  useEffect(() => {
    const t = setTimeout(() => { setPhase('learn'); started.current = Date.now() }, 900)
    return () => clearTimeout(t)
  }, [])

  /* ---- teaching ---- */
  const nextCard = () => {
    if (cardAt < lesson.cards.length - 1) setCardAt(cardAt + 1)
    else { sfx.swoosh(); setPhase('practice') }
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
  primary.current = () => {
    if (verdict) advance()
    else if (phase === 'learn') nextCard()
    else if (phase === 'practice' && canCheck) check()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || e.isComposing) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
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
        <AnimatePresence mode="wait" initial={false}>
          {/* ---------------- تعلّم ---------------- */}
          {phase === 'learn' && (
            <motion.div key={`c${cardAt}`} className="cardstage"
              initial={{ opacity: 0, x: 34 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -34 }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>
              <CardView card={lesson.cards[cardAt]} unitId={unit?.id ?? 'u-intro'} withScene={cardAt === sceneCard} />
              <div className="dots">
                {lesson.cards.map((_, i) => (
                  <span key={i} className={`dots__d${i === cardAt ? ' is-on' : i < cardAt ? ' is-past' : ''}`} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ---------------- رسّخ ---------------- */}
          {phase === 'practice' && ex && (
            <motion.div key={`e${exAt}`} className="ex"
              initial={{ opacity: 0, x: 34 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -34 }}
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
            <Button block tone="gold" onClick={nextCard}>
              {cardAt < lesson.cards.length - 1 ? 'التالي' : 'لنتدرّب'}
            </Button>
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

const GOOD = ['أحسنت!', 'ممتاز!', 'بالضبط!', 'رائع!', 'أصبتَ!', 'تمامًا!']
const pick = (a: string[], i: number) => a[i % a.length]

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
            ) : card.art ? (
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
