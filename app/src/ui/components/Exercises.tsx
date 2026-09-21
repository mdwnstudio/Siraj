import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import type {
  BooleanExercise, ChoiceExercise, Exercise, MatchExercise, OrderExercise, SortExercise,
} from '../../core/types'
import type { Answer } from '../../core/engine/grading'
import { shuffle } from '../../core/engine/grading'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'
import { Sparkle } from '../icons/SirajIcons'
import { Siraj, type Mood } from './Siraj'

/** how the host feels right now; the lesson owns it (thinking, cheering, sad) */
export const HostMood = createContext<Mood>('idle')

/* Siraj asks every question himself, from a speech bubble beside him. */
function Prompt({ children }: { children: ReactNode }) {
  const mood = useContext(HostMood)
  return (
    <div className="host">
      <div className="host__siraj"><Siraj mood={mood} size={78} /></div>
      <div className="bubble bubble--side host__bubble">
        <h2 className="ex__prompt">{children}</h2>
      </div>
    </div>
  )
}

export interface ExProps {
  ex: Exercise
  locked: boolean
  /** report the current answer upward so the parent can enable "تحقّق" */
  onChange: (a: Answer | null) => void
  /** match & sort resolve themselves - no check button */
  onAutoSubmit?: (a: Answer) => void
  /** after checking: paint the right answer */
  revealed: boolean
}

export function ExerciseView(p: ExProps) {
  switch (p.ex.kind) {
    case 'choice':  return <ChoiceEx {...p} ex={p.ex} />
    case 'boolean': return <BooleanEx {...p} ex={p.ex} />
    case 'order':   return <OrderEx {...p} ex={p.ex} />
    case 'match':   return <MatchEx {...p} ex={p.ex} />
    case 'sort':    return <SortEx {...p} ex={p.ex} />
  }
}

const tap = () => { primeAudio(); sfx.select(); haptic('tap') }

/* ---------------- اختر الصحيح ---------------- */

function ChoiceEx({ ex, locked, onChange, revealed }: ExProps & { ex: ChoiceExercise }) {
  const [sel, setSel] = useState<string | null>(null)
  useEffect(() => { setSel(null); onChange(null) }, [ex.id])

  return (
    <>
      <Prompt>{ex.prompt}</Prompt>
      <div className="choices">
        {ex.options.map((o, i) => {
          const chosen = sel === o.id
          const right = revealed && o.id === ex.answerId
          const wrong = revealed && chosen && o.id !== ex.answerId
          return (
            <motion.button
              key={o.id}
              className={`tile${chosen && !revealed ? ' is-on' : ''}${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
              disabled={locked}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              onClick={() => { tap(); setSel(o.id); onChange({ kind: 'choice', optionId: o.id }) }}
            >
              {o.label}
            </motion.button>
          )
        })}
      </div>
    </>
  )
}

/* ---------------- صح أم خطأ ---------------- */

function BooleanEx({ ex, locked, onChange, revealed }: ExProps & { ex: BooleanExercise }) {
  const [sel, setSel] = useState<boolean | null>(null)
  useEffect(() => { setSel(null); onChange(null) }, [ex.id])

  const cell = (val: boolean, label: string, cls: string) => {
    const chosen = sel === val
    const right = revealed && val === ex.answer
    const wrong = revealed && chosen && val !== ex.answer
    return (
      <button
        className={`tile bool ${cls}${chosen && !revealed ? ' is-on' : ''}${right ? ' is-right' : ''}${wrong ? ' is-wrong' : ''}`}
        disabled={locked}
        onClick={() => { tap(); setSel(val); onChange({ kind: 'boolean', value: val }) }}
      >
        {label}
      </button>
    )
  }

  return (
    <>
      <Prompt>{ex.prompt ?? 'صحيح أم خطأ؟'}</Prompt>
      <div className="ex__statement">{ex.statement}</div>
      <div className="bools">
        {cell(true, 'صح', 'bool--yes')}
        {cell(false, 'خطأ', 'bool--no')}
      </div>
    </>
  )
}

/* ---------------- رتّب الخطوات ---------------- */

function OrderEx({ ex, locked, onChange, revealed }: ExProps & { ex: OrderExercise }) {
  const [placed, setPlaced] = useState<string[]>([])
  useEffect(() => { setPlaced([]); onChange(null) }, [ex.id])

  const label = (id: string) => ex.items.find((i) => i.id === id)?.label ?? ''

  const push = (id: string) => {
    if (locked || placed.includes(id)) return
    tap()
    const next = [...placed, id]
    setPlaced(next)
    onChange(next.length === ex.items.length ? { kind: 'order', sequence: next } : null)
  }
  const pull = (id: string) => {
    if (locked) return
    tap()
    const next = placed.filter((x) => x !== id)
    setPlaced(next)
    onChange(null)
  }

  return (
    <>
      <Prompt>{ex.prompt}</Prompt>

      <div className="slots" data-hint="اضغط على الخطوات بالترتيب">
        <AnimatePresence initial={false}>
          {placed.map((id, i) => {
            const ok = revealed && ex.answer[i] === id
            const bad = revealed && ex.answer[i] !== id
            return (
              <motion.button
                key={id}
                layout
                className={`chip chip--placed${ok ? ' is-right' : ''}${bad ? ' is-wrong' : ''}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                onClick={() => pull(id)}
                disabled={locked}
                style={bad ? { borderColor: 'var(--bad)', background: 'var(--bad-soft)', color: 'var(--bad-deep)', boxShadow: '0 4px 0 var(--bad)' } : undefined}
              >
                <span className="chip__n">{i + 1}</span>
                {label(id)}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="pool">
        {ex.items.map((it) => (
          <button
            key={it.id}
            className={`chip${placed.includes(it.id) ? ' chip--ghost' : ''}`}
            onClick={() => push(it.id)}
            disabled={locked || placed.includes(it.id)}
          >
            {it.label}
          </button>
        ))}
      </div>

      {revealed && (
        <p style={{ marginTop: 14, fontWeight: 700, color: 'var(--ink-2)', fontSize: '.9rem' }}>
          الترتيب الصحيح: {ex.answer.map(label).join(' ← ')}
        </p>
      )}
    </>
  )
}

/* ---------------- طابِق ---------------- */

function MatchEx({ ex, locked, onAutoSubmit }: ExProps & { ex: MatchExercise }) {
  const lefts = useMemo(() => shuffle(ex.pairs.map((p) => p.id), 7), [ex.id])
  const rights = useMemo(() => shuffle(ex.pairs.map((p) => p.id), 13), [ex.id])
  const [pickL, setPickL] = useState<string | null>(null)
  const [pickR, setPickR] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const [bad, setBad] = useState<string[]>([])
  const mistakes = useRef(0)

  useEffect(() => { setPickL(null); setPickR(null); setDone([]); setBad([]); mistakes.current = 0 }, [ex.id])

  // resolve whenever a pair is fully selected
  useEffect(() => {
    if (!pickL || !pickR) return
    if (pickL === pickR) {
      sfx.snap(); haptic('correct')
      const next = [...done, pickL]
      setDone(next)
      setPickL(null); setPickR(null)
      if (next.length === ex.pairs.length) {
        setTimeout(() => onAutoSubmit?.({ kind: 'match', mistakes: mistakes.current }), 420)
      }
    } else {
      mistakes.current += 1
      sfx.wrong(); haptic('wrong')
      setBad([pickL, pickR])
      const t = setTimeout(() => { setBad([]); setPickL(null); setPickR(null) }, 460)
      return () => clearTimeout(t)
    }
  }, [pickL, pickR])

  const cell = (id: string, side: 'l' | 'r', text: string) => {
    const isDone = done.includes(id)
    const chosen = side === 'l' ? pickL === id : pickR === id
    const isBad = bad.includes(id) && chosen
    return (
      <button
        key={side + id}
        className={`tile${chosen ? ' is-on' : ''}${isDone ? ' is-paired' : ''}${isBad ? ' is-wrong shake' : ''}`}
        disabled={locked || isDone}
        onClick={() => { tap(); side === 'l' ? setPickL(id) : setPickR(id) }}
      >
        {text}
      </button>
    )
  }

  return (
    <>
      <Prompt>{ex.prompt}</Prompt>
      <div className="match">
        <div className="match__col">
          {lefts.map((id) => cell(id, 'l', ex.pairs.find((p) => p.id === id)!.left))}
        </div>
        <div className="match__col">
          {rights.map((id) => cell(id, 'r', ex.pairs.find((p) => p.id === id)!.right))}
        </div>
      </div>
    </>
  )
}

/* ---------------- صنّف ---------------- */

function SortEx({ ex, locked, onAutoSubmit }: ExProps & { ex: SortExercise }) {
  const order = useMemo(() => shuffle(ex.items.map((i) => i.id), 5), [ex.id])
  const [at, setAt] = useState(0)
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [fly, setFly] = useState<-1 | 1 | 0>(0)

  useEffect(() => { setAt(0); setPlacements({}); setFly(0) }, [ex.id])

  const item = (id: string) => ex.items.find((i) => i.id === id)!
  const remaining = order.slice(at)

  const assign = (bucketId: string, dir: -1 | 1) => {
    if (locked || at >= order.length) return
    const id = order[at]
    const right = item(id).bucket === bucketId
    right ? sfx.snap() : sfx.wrong()
    haptic(right ? 'correct' : 'wrong')
    setFly(dir)
    const next = { ...placements, [id]: bucketId }
    setPlacements(next)
    setTimeout(() => {
      setFly(0)
      const k = at + 1
      setAt(k)
      if (k >= order.length) {
        setTimeout(() => onAutoSubmit?.({ kind: 'sort', placements: next }), 260)
      }
    }, 230)
  }

  const count = (b: string) => Object.values(placements).filter((x) => x === b).length

  return (
    <>
      <Prompt>{ex.prompt}</Prompt>
      <div className="sort">
        <div className="sort__stage">
          <AnimatePresence initial={false}>
            {remaining.slice(0, 3).reverse().map((id, revIdx) => {
              const depth = Math.min(2, remaining.length - 1 - revIdx)
              const isTop = depth === 0
              return (
                <motion.div
                  key={id}
                  className={`sort__card${depth === 1 ? ' sort__card--back' : depth === 2 ? ' sort__card--back2' : ''}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    x: fly * 280, y: -40, rotate: fly * 18, opacity: 0, scale: 0.85,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  style={isTop ? undefined : { pointerEvents: 'none' }}
                >
                  {item(id).label}
                </motion.div>
              )
            })}
          </AnimatePresence>
          {remaining.length === 0 && (
            <div style={{ display: 'grid', placeItems: 'center', gap: 8, color: 'var(--good-deep)' }}>
              <Sparkle size={34} />
              <b>تمّ التصنيف</b>
            </div>
          )}
        </div>

        <div className="sort__buckets">
          <button className="bucket" disabled={locked || !remaining.length} onClick={() => assign(ex.buckets[0].id, 1)}>
            <span>{ex.buckets[0].label}</span>
            <span className="bucket__count num">{count(ex.buckets[0].id)}</span>
          </button>
          <button className="bucket" disabled={locked || !remaining.length} onClick={() => assign(ex.buckets[1].id, -1)}>
            <span>{ex.buckets[1].label}</span>
            <span className="bucket__count num">{count(ex.buckets[1].id)}</span>
          </button>
        </div>
      </div>
    </>
  )
}
