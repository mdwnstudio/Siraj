import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../core/types'
import { askSirajStream } from '../../core/ai/askSiraj'
import { parseAnswer } from '../../core/ai/answerText'
import { conceptsFromLesson } from '../../core/ai/systemPrompt'
import { SirajPose, usePreloadPoses, type Pose } from '../components/SirajPose'
import { Button } from '../components/Button'
import { useApp } from '../state'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

interface Msg {
  id: number
  who: 'me' | 'siraj' | 'err'
  text: string
  sources?: { title: string; url: string }[]
  /** still being written: hide half-finished markdown, show a caret */
  live?: boolean
  /** the whole reply, known before typing starts, so the bubble takes
   *  its final size at once and the text types into it */
  full?: string
}

/* What Siraj says he is doing while the learner waits. The stages follow
   the real stream (searching, then writing); the later lines only appear
   if a search genuinely runs long, so the wait always has a voice. */
type Stage = 'reading' | 'searching' | 'digging' | 'patient' | 'writing'
const STAGE_TEXT: Record<Stage, string> = {
  reading: 'أقرأ سؤالك…',
  searching: 'أبحث في مصادري الموثوقة…',
  digging: 'أراجع ما وجدتُ لأنقله بدقّة…',
  patient: 'ما زلت أبحث، الجواب الدقيق يستحق لحظة صبر…',
  writing: 'وجدتُ الجواب، أكتبه لك…',
}

const AFTER = ['هل بقي شيء غير واضح؟', 'تفضّل بسؤال آخر.', 'اسألني عن أي شيء في هذا الدرس.']

export function AskSiraj({
  lesson, unitTitle, onFinish,
}: {
  lesson: Lesson
  unitTitle: string
  /** only the end-of-lesson chat has a way onward; the home tab's chat
   *  is a place to stay, so it gets no تابع / تخطّي button */
  onFinish?: () => void
}) {
  const { progress, dispatch } = useApp()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<Stage>('reading')
  const [used, setUsed] = useState<string[]>([])
  const [pose, setPose] = useState<Pose>('listen')
  const [say, setSay] = useState<string | null>(null)
  const thread = useRef<HTMLDivElement>(null)
  const seq = useRef(0)
  const moodTimer = useRef<number>(0)

  const left = lesson.ask.filter((s) => !used.includes(s.q))

  // Scroll before the browser paints, not after: a post-paint smooth scroll
  // shows one frame at the old offset, which reads as the thread lurching.
  useLayoutEffect(() => {
    const el = thread.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, busy, stage])

  useEffect(() => {
    return () => { window.clearTimeout(moodTimer.current); window.clearTimeout(typer.current) }
  }, [])

  usePreloadPoses()

  /** strike a pose; with `back`, return to listening after that long */
  const react = (p: Pose, back?: number) => {
    window.clearTimeout(moodTimer.current)
    setPose(p)
    if (back) moodTimer.current = window.setTimeout(() => setPose('listen'), back)
  }

  // Long waits get a new line from Siraj, so it never looks frozen.
  useEffect(() => {
    if (!busy || stage === 'writing') return
    const next: Partial<Record<Stage, [Stage, number]>> = {
      reading: ['searching', 1400],
      searching: ['digging', 6500],
      digging: ['patient', 9000],
    }
    const n = next[stage]
    if (!n) return
    const t = window.setTimeout(() => setStage((s) => (s === stage ? n[0] : s)), n[1])
    return () => window.clearTimeout(t)
  }, [busy, stage])

  /* ---------- the typewriter ----------
     The reply is complete before the bubble opens, so the bubble is
     sized once and the text types into it at a steady pace. */
  const target = useRef('')
  const shown = useRef(0)
  const liveId = useRef<number | null>(null)
  const typer = useRef(0)
  const settle = useRef<(() => void) | null>(null)
  const ended = useRef(false)

  const tick = () => {
    const t = target.current
    if (shown.current < t.length) {
      // an even pace that finishes any reply in about two seconds; a
      // background tab throttles timers to once a second, so skip the show
      shown.current = document.hidden
        ? t.length
        : Math.min(t.length, shown.current + Math.max(1, Math.round(t.length / 120)))
      const v = t.slice(0, shown.current)
      const id = liveId.current
      setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, text: v } : m)))
    } else if (ended.current && settle.current) {
      settle.current()
      settle.current = null
      return
    }
    typer.current = window.setTimeout(tick, 16)
  }

  const push = (m: Omit<Msg, 'id'>) => {
    const id = seq.current++
    setMsgs((prev) => [...prev, { ...m, id }])
    return id
  }

  /** open a live Siraj bubble the typewriter writes into */
  const startReply = (full: string, sources?: Msg['sources']) => {
    if (liveId.current !== null) return
    target.current = full
    shown.current = 0
    ended.current = false
    liveId.current = push({ who: 'siraj', text: '', full, sources, live: true })
    setBusy(false)
    setSay('إليك الجواب:')
    sfx.chirp(); haptic('tap')
    react('answer')
    window.clearTimeout(typer.current)
    typer.current = window.setTimeout(tick, 16)
  }

  /** let the typewriter finish, then seal the bubble */
  const finishReply = () =>
    new Promise<void>((resolve) => {
      ended.current = true
      settle.current = () => {
        const id = liveId.current
        setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, text: m.full ?? m.text, live: false } : m)))
        liveId.current = null
        resolve()
      }
    })

  const answered = () => {
    sfx.snap()
    react('celebrate', 1500)
    setSay(AFTER[Math.floor(Math.random() * AFTER.length)])
    if (!progress.achievements.includes('curious')) dispatch({ type: 'grant', id: 'curious' })
  }

  const thinking = () => {
    setStage('reading')
    setBusy(true)
    react('think')
    setSay('لحظة، دعني أتحقّق…')
  }

  /* A suggested question answers instantly from bundled text - no
     network, no spend, works offline. Only free-typed questions hit the API. */
  const askCanned = (q: string, a: string) => {
    if (busy || liveId.current !== null) return
    primeAudio(); sfx.tap(); haptic('tap')
    setUsed((u) => [...u, q])
    push({ who: 'me', text: q })
    thinking()
    window.setTimeout(async () => {
      startReply(a)
      await finishReply()
      answered()
    }, 700)
  }

  const askLive = async () => {
    const q = text.trim()
    if (!q || busy || liveId.current !== null) return
    primeAudio(); sfx.tap(); haptic('tap')
    setText('')
    push({ who: 'me', text: q })
    thinking()

    const res = await askSirajStream(q, {
      unitTitle,
      lessonTitle: lesson.title,
      taughtConcepts: conceptsFromLesson(lesson.cards),
    }, {
      // the stream drives what Siraj says he is doing; the text itself
      // is typed once it is complete (it lands within about a second
      // of the first word), so the bubble never grows as it types
      onStatus: (s) => setStage((cur) => (s === 'writing' ? 'writing' : cur === 'reading' ? 'searching' : cur)),
      onText: () => setStage('writing'),
    })

    if (res.ok && res.answer) {
      startReply(res.answer, res.sources)
      await finishReply()
      answered()
    } else {
      setBusy(false)
      push({ who: 'err', text: res.message ?? 'تعذّر الحصول على إجابة.' })
      sfx.wrong()
      react('oops', 2800)
      setSay('عذرًا، لم أتمكّن هذه المرة.')
    }
  }

  const writing = busy || liveId.current !== null

  return (
    <>
      <div className="ask__head">
        <SirajPose pose={pose} size={80} />
        <div className="bubble bubble--side ask__say">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={say ?? 'intro'} style={{ display: 'block' }}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}>
              {say ?? <>شيءٌ لم يتّضح في <b style={{ color: 'var(--orange)' }}>{lesson.title}</b>؟ اسألني.</>}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <span className="ask__fade" aria-hidden />

      <div className="ask__thread" ref={thread} aria-live="polite">
        {msgs.map((m) => (
          /* No layout animation here: a gliding row passes over the new one
             as it arrives, so the question would slide across the reply.
             Earlier rows move before paint; only the new row fades up. */
          <motion.div key={m.id} className={`msg-row msg-row--${m.who}`}
            initial={{ opacity: 0, y: m.who === 'siraj' ? 0 : 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: m.who === 'siraj' ? 0.15 : 0.25, ease: [0.23, 1, 0.32, 1] }}>
            {m.who === 'siraj' && <span className={`ask__face${m.live ? ' ask__face--talk' : ''}`} aria-hidden />}
            <div className={`msg msg--${m.who}`}>
              {m.who === 'siraj' ? <Answer text={m.text} full={m.full} sources={m.sources} live={m.live} /> : m.text}
              {!!m.sources?.length && (
                <div className={`msg__src${m.live ? ' is-waiting' : ''}`}>
                  {m.sources.map((s) => (
                    <a key={s.url} className="msg__srclink" href={s.url} target="_blank" rel="noreferrer noopener">
                      {sourceLabel(s.title)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {/* no exit animation: the reply takes this row's place in the same
            frame, instead of both sharing the space while it collapses */}
        {busy && (
          <motion.div className="msg-row msg-row--siraj"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
            <span className="ask__face ask__face--think" aria-hidden />
            <div className="thinking">
              <span className="thinking__dots"><span /><span /><span /></span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={stage} className="thinking__say"
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}>
                  {STAGE_TEXT[stage]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      <div className="ask__pills">
        <AnimatePresence>
          {left.slice(0, 3).map((s, i) => (
            <motion.button key={s.q} className="pill" style={{ animationDelay: `${i * 70}ms` }}
              layout
              exit={{
                opacity: 0, scale: 0.92, height: 0, paddingTop: 0, paddingBottom: 0,
                marginTop: 0, borderWidth: 0,
                transition: { duration: 0.22, ease: [0.32, 0, 0.67, 0] },
              }}
              onClick={() => askCanned(s.q, s.a)} disabled={writing}>
              {s.q}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="ask__compose">
        <input
          className="ask__input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 400))}
          placeholder="أو اكتب سؤالك…"
          enterKeyHint="send"
          onKeyDown={(e) => e.key === 'Enter' && askLive()}
          disabled={writing}
        />
        <button className="ask__send" onClick={askLive} disabled={writing || !text.trim()} aria-label="إرسال">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12 H5 M11 6 L5 12 L11 18" />
          </svg>
        </button>
      </div>

      <p className="ask__note">يجيب سراج نقلًا عن مصادر موثوقة فقط.</p>

      {onFinish && (
        <div className="ask__finish">
          <Button block tone={msgs.length ? 'primary' : 'quiet'} onClick={onFinish}>
            {msgs.length ? 'تابع' : 'تخطّي'}
          </Button>
        </div>
      )}
    </>
  )
}

/** Answer text with links resolved: a link already listed under sources
 *  is dropped, any other one becomes a short blue link. */
function Answer({ text, full, sources, live }: { text: string; full?: string; sources?: Msg['sources']; live?: boolean }) {
  if (!live || full === undefined) return <span className="msg__body"><Segments text={text} sources={sources} /></span>
  /* Two layers in one grid cell: the finished reply, invisible, sets the
     bubble's size from the first frame; the typed part is drawn over it. */
  return (
    <span className="msg__body msg__body--typing">
      <span className="msg__ghost" aria-hidden><Segments text={full} sources={sources} /></span>
      <span className="msg__typed">
        <Segments text={text} sources={sources} live />
        <span className="msg__caret" aria-hidden />
      </span>
    </span>
  )
}

function Segments({ text, sources, live }: { text: string; sources?: Msg['sources']; live?: boolean }) {
  return (
    <>
      {parseAnswer(text, sources, { streaming: live }).map((p, i) =>
        p.k === 'link' ? (
          <a key={i} className="msg__link" href={p.url} target="_blank" rel="noreferrer noopener" dir="auto">{p.label}</a>
        ) : p.k === 'bold' ? (
          <b key={i}>{p.v}</b>
        ) : (
          <Fragment key={i}>{p.v}</Fragment>
        ),
      )}
    </>
  )
}

/** "Sahih al-Bukhari 8 - Belief - Sunnah.com - Sayings and..." -> "Sahih al-Bukhari 8" */
function sourceLabel(title: string): string {
  const head = title.split(/\s+[-|\u2013]\s+/)[0].trim()
  return head.length > 32 ? head.slice(0, 31).trimEnd() + '…' : head
}
