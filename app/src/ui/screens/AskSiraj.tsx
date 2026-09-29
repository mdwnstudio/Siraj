import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, animate, m as motion } from 'framer-motion'
import type { AskSuggestion, Lang, Progress } from '../../core/types'
import { askSirajStream, recentHistory } from '../../core/ai/askSiraj'
import { parseAnswer } from '../../core/ai/answerText'
import { buildAskContext, lessonNodes } from '../../core/ai/context'
import { GENERAL, chatTitle, newChatId, type ChatMsg, type ReplyOrigin, type SavedChat, type SubjectId } from '../../core/ai/chats'
import { quoteRuns } from '../../core/quoteRuns'
import { getLesson } from '../../core/content/lessons'
import { chatStore } from '../chats'
import { POSE_SRC, SirajPose, usePreloadPoses, type Pose } from '../components/SirajPose'
import { Button } from '../components/Button'
import { RichText } from '../components/Gloss'
import { useApp, useCalmMotion, useT } from '../state'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

interface Msg {
  id: number
  who: 'me' | 'siraj' | 'err'
  text: string
  sources?: { title: string; url: string }[]
  /** the server's signature on a live reply, kept for the history */
  sig?: string
  /** written by the AI, or a bundled answer prepared in advance */
  origin?: ReplyOrigin
  /** still being written: hide half-finished markdown, show a caret */
  live?: boolean
  /** the whole reply, known before typing starts, so the bubble takes
   *  its final size at once and the text types into it */
  full?: string
  /** size of the thinking bubble this reply grows out of */
  grow?: { w: number; h: number }
}

/* What Siraj says he is doing while the learner waits. The stages follow
   the real stream (searching, then writing); the later lines only appear
   if a search genuinely runs long, so the wait always has a voice. */
type Stage = 'reading' | 'searching' | 'digging' | 'patient' | 'writing'

/* One Siraj, never two. An empty chat has him standing large at the top;
   the first question makes him think, then he glides down into the
   thread, cropped to a circle on the way, and from then on he is the
   little face beside every answer. A saved chat opens already solo. */
type Place = 'head' | 'flying' | 'solo'

/** where the flight starts and lands, in the chat's own coordinates */
interface Flight {
  /** the big drawing in the header, and its tilt from the rig at that moment */
  from: { x: number; y: number; w: number; tilt: string }
  /** the chat's box, and the face beside the thinking bubble. The face is
   *  followed every frame: a used pill can still be closing up below it */
  box: HTMLElement
  face: HTMLElement
}

/** the face's corner and size in the chat's coordinates, without the fade-up its row may still carry */
function faceSpot(box: HTMLElement, face: HTMLElement) {
  const o = box.getBoundingClientRect()
  const b = face.getBoundingClientRect()
  const lift = new DOMMatrix(getComputedStyle(face.parentElement!).transform).m42
  return { x: b.left - o.left, y: b.top - lift - o.top, d: b.width }
}

export function AskSiraj({
  subject, chat, draft, onFinish, onSaved,
}: {
  /** what the chat is about: a lesson id, or GENERAL for the whole course */
  subject: SubjectId
  /** a saved chat to pick up where it was left */
  chat?: SavedChat
  /** a question to start with, typed in but not sent */
  draft?: string
  /** only the end-of-lesson chat has a way onward; the home tab's chat
   *  is a place to stay, so it gets no تابع / تخطّي button */
  onFinish?: () => void
  /** the chat was saved to the device, under this id */
  onSaved?: (id: string) => void
}) {
  const { progress, dispatch } = useApp()
  const t = useT()
  const calm = useCalmMotion()
  const lang = progress.language
  const lesson = subject === GENERAL ? undefined : getLesson(subject, lang)
  const [msgs, setMsgs] = useState<Msg[]>(() => (chat?.msgs ?? []).map((m, id) => ({ ...m, id })))
  const [text, setText] = useState(draft ?? '')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState<Stage>('reading')
  const [used, setUsed] = useState<string[]>(() => (chat?.msgs ?? []).filter((m) => m.who === 'me').map((m) => m.text))
  const [pose, setPose] = useState<Pose>('listen')
  const [where, setWhere] = useState<Place>(() => (chat?.msgs.length ? 'solo' : 'head'))
  const [flight, setFlight] = useState<Flight | null>(null)
  const thread = useRef<HTMLDivElement>(null)
  const thinkBubble = useRef<HTMLDivElement>(null)
  const headPose = useRef<HTMLDivElement>(null)
  const thinkFace = useRef<HTMLSpanElement>(null)
  const seq = useRef(chat?.msgs.length ?? 0)
  const flyTimer = useRef(0)
  /** settles when Siraj has landed in the thread; a reply waits for it */
  const arrival = useRef<Promise<void>>(Promise.resolve())
  const land = useRef<(() => void) | null>(null)

  // the lesson's own questions, or for the whole course a few from what was learned
  const suggestions = useMemo(
    () => lesson?.ask ?? generalSuggestions(progress, lang),
    // not on every progress change: the pills must not reshuffle mid-chat
    [lesson, lang],
  )
  const left = suggestions.filter((s) => !used.includes(s.q))

  /* ---------- saved to the device ----------
     Each finished message is written straight away, the way chat apps
     autosave: nothing to press, and a closed app never loses a reply.
     A new chat gets its id with its first message. */
  const chatId = useRef(chat?.id ?? null)
  const created = useRef(chat?.created ?? 0)
  const dirty = useRef(false)
  useEffect(() => {
    if (!dirty.current || busy || msgs.some((m) => m.live)) return
    dirty.current = false
    const keep: ChatMsg[] = []
    for (const m of msgs) {
      if (m.who === 'err') continue
      keep.push({ who: m.who, text: m.text, ...(m.sources?.length ? { sources: m.sources } : {}), ...(m.sig ? { sig: m.sig } : {}), ...(m.origin ? { origin: m.origin } : {}) })
    }
    if (!keep.length) return
    const now = Date.now()
    if (!chatId.current) { chatId.current = newChatId(); created.current = now }
    const first = keep.find((m) => m.who === 'me') ?? keep[0]
    chatStore.put({ id: chatId.current, subject, lang, title: chatTitle(first.text), created: created.current, updated: now, msgs: keep })
    onSaved?.(chatId.current)
  }, [msgs, busy])

  // Scroll before the browser paints, not after: a post-paint smooth scroll
  // shows one frame at the old offset, which reads as the thread lurching.
  useLayoutEffect(() => {
    const el = thread.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, busy, stage])

  useEffect(() => {
    return () => { window.clearTimeout(flyTimer.current); window.clearTimeout(typer.current); land.current?.() }
  }, [])

  usePreloadPoses()

  /** The first question: Siraj has just changed to his thinking face in
   *  the header; a beat later he flies down to the thinking bubble. */
  const descend = () => {
    if (where !== 'head') return
    setWhere('flying')
    arrival.current = new Promise((resolve) => {
      land.current = () => {
        land.current = null
        setFlight(null)
        setWhere('solo')
        resolve()
      }
      // a beat for the new face to show
      flyTimer.current = window.setTimeout(() => {
        const box = thread.current?.parentElement
        const head = headPose.current
        const face = thinkFace.current
        if (calm || !box || !head || !face) return land.current?.()
        const o = box.getBoundingClientRect()
        const a = head.getBoundingClientRect()
        const img = head.querySelector('img')
        setFlight({
          from: { x: a.left - o.left, y: a.top - o.top, w: a.width, tilt: img ? getComputedStyle(img).transform : 'none' },
          box, face,
        })
      }, 420)
    })
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
    dirty.current = true
    const id = seq.current++
    setMsgs((prev) => [...prev, { ...m, id }])
    return id
  }

  /** Open a live Siraj bubble. It is born at the thinking bubble's size,
   *  in the same spot, springs out to its final size, and only then
   *  does the typewriter start (GrowBubble calls startTyping). */
  const startReply = (full: string, origin: ReplyOrigin, sources?: Msg['sources'], sig?: string) => {
    if (liveId.current !== null) return
    const r = thinkBubble.current?.getBoundingClientRect()
    target.current = full
    shown.current = 0
    ended.current = false
    liveId.current = push({
      who: 'siraj', text: '', full, sources, sig, origin, live: true,
      grow: r ? { w: r.width, h: r.height } : { w: 64, h: 46 },
    })
    setBusy(false)
    sfx.chirp(); haptic('tap')
  }

  // stable, so a typed character re-renders only the live row (MsgRow is memoised)
  const tickLatest = useRef(tick)
  tickLatest.current = tick
  const startTyping = useCallback(() => {
    window.clearTimeout(typer.current)
    typer.current = window.setTimeout(() => tickLatest.current(), 16)
  }, [])

  const pinToBottom = useCallback(() => {
    const el = thread.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

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
    if (!progress.achievements.includes('curious')) dispatch({ type: 'grant', id: 'curious' })
  }

  const thinking = () => {
    setStage('reading')
    setBusy(true)
    setPose('think')
    descend()
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
      await arrival.current
      startReply(a, 'prepared')
      await finishReply()
      answered()
    }, 700)
  }

  const askLive = async () => {
    const q = text.trim()
    if (!q || busy || liveId.current !== null) return
    primeAudio(); sfx.tap(); haptic('tap')
    // the conversation so far goes with the question, so a follow-up makes sense
    const history = recentHistory(msgs.flatMap((m) => (m.who === 'err' || m.live ? [] : [{ who: m.who, text: m.text, sig: m.sig }])))
    setText('')
    push({ who: 'me', text: q })
    thinking()

    const res = await askSirajStream(q, buildAskContext(subject, lang, (id) => getLesson(id, lang)), {
      // the stream drives what Siraj says he is doing; the text itself
      // is typed once it is complete (it lands within about a second
      // of the first word), so the bubble never grows as it types
      onStatus: (s) => setStage((cur) => (s === 'writing' ? 'writing' : cur === 'reading' ? 'searching' : cur)),
      onText: () => setStage('writing'),
    }, history)
    await arrival.current

    if (res.ok && res.answer) {
      startReply(res.answer, 'ai', res.sources, res.sig)
      await finishReply()
      answered()
    } else {
      setBusy(false)
      push({ who: 'err', text: res.message ?? t.askFailed })
      sfx.wrong()
    }
  }

  const writing = busy || liveId.current !== null
  // a typed question is waiting to be sent: moving on now would lose it
  const drafting = !!text.trim()

  return (
    <>
      {/* gone from the layout once he lands: the thread is pinned to the
          bottom, so it only grows upward and nothing in it moves */}
      {where !== 'solo' && (
        <div className={`ask__head${flight ? ' is-flying' : ''}`}>
          <div ref={headPose}><SirajPose pose={pose} size={80} /></div>
          <div className="bubble bubble--side ask__say">
            {/* the intro stays put until he leaves: a line typed here just
                before he flies off only reads as a false start */}
            {lesson ? <>{t.askIntro.before}<b style={{ color: 'var(--orange)' }}>{lesson.title}</b>{t.askIntro.after}</>
              : t.askIntroGeneral}
          </div>
        </div>
      )}
      {flight && <Flier f={flight} onLanded={() => land.current?.()} />}

      <span className="ask__fade" aria-hidden />

      <div className="ask__thread" ref={thread} aria-live="polite">
        {msgs.map((m) => (
          <MsgRow key={m.id} m={m} calm={calm} onStep={pinToBottom} onGrown={startTyping} />
        ))}
        {/* no exit animation: the reply takes this row's place in the same
            frame, instead of both sharing the space while it collapses */}
        {busy && (
          <motion.div className="msg-row msg-row--siraj"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
            {/* hidden until Siraj flies down into it */}
            <span ref={thinkFace} className={`ask__face ask__face--think${where !== 'solo' ? ' is-away' : ''}`} aria-hidden />
            <div className="thinking" ref={thinkBubble}>
              <span className="thinking__dots"><span /><span /><span /></span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={stage} className="thinking__say"
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}>
                  {t.stage[stage]}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>

      <div className="ask__pills">
        <AnimatePresence>
          {left.slice(0, 3).map((s, i) => (
            /* no layout prop: the exit collapses the pill's own height, so
               the ones below close up with it (LazyMotion ships no layout code) */
            <motion.button key={s.q} className="pill" style={{ animationDelay: `${i * 70}ms` }}
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
          placeholder={t.askPlaceholder}
          enterKeyHint="send"
          onKeyDown={(e) => e.key === 'Enter' && askLive()}
          disabled={writing}
        />
        <button className="ask__send" onClick={askLive} disabled={writing || !text.trim()} aria-label={t.send}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            {/* the arrow points the way the text reads: left in Arabic, right in English */}
            <path d={progress.language === 'en' ? 'M5 12 H19 M13 6 L19 12 L13 18' : 'M19 12 H5 M11 6 L5 12 L11 18'} />
          </svg>
        </button>
      </div>

      <p className={`ask__note${onFinish && drafting ? ' is-warn' : ''}`}>
        {onFinish && drafting ? t.askDraftNote : t.askNote}
      </p>

      {onFinish && (
        <div className="ask__finish">
          {/* greyed out while a question is typed or a reply is on its way:
              this button ends the lesson, and a learner about to send a
              question kept pressing it as if it would send */}
          <Button block tone={msgs.length && !drafting ? 'primary' : 'quiet'}
            disabled={drafting || writing} onClick={onFinish}>
            {msgs.length ? t.askDone : t.skip}
          </Button>
        </div>
      )}
    </>
  )
}

/* The face's crop, as .ask__face--think draws it: a 2px border, the
   drawing at 170% of the inner circle, placed at 48% 55%. */
const FACE_BORDER = 2
const FACE_ZOOM = 1.7
const FACE_AT = [0.48, 0.55] as const

/* the flight: down to the spot by HIT, with speed left over, then a
   small dip past it and a pop that settle by the end */
const FLY_S = 0.68
const HIT = 0.7
const DIP = 7
const POP = 0.08

const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Siraj on his way down. The box is the drawing exactly as the face
 *  crops it, so the flight is one transform from the header's size and
 *  place down to scale 1, while a circle closes in around his head and
 *  the face's disc and ring fade up as it closes. At the end he is pixel
 *  for pixel the face, which takes over in the same frame. */
function Flier({ f, onLanded }: { f: Flight; onLanded: () => void }) {
  const el = useRef<HTMLDivElement>(null)
  const [to] = useState(() => faceSpot(f.box, f.face))
  const inner = to.d - 2 * FACE_BORDER
  const w = inner * FACE_ZOOM
  const h = (w * 490) / 420
  // the drawing's corner, measured from the face's corner
  const ox = FACE_BORDER + (inner - w) * FACE_AT[0]
  const oy = FACE_BORDER + (inner - h) * FACE_AT[1]
  const left = to.x + ox
  const top = to.y + oy
  // the face's centre inside the box, and a radius that clips nothing
  const cx = to.d / 2 - ox
  const cy = to.d / 2 - oy
  const r1 = to.d / 2
  const r0 = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 2

  useLayoutEffect(() => {
    const node = el.current
    if (!node) return
    const img = node.querySelector('img')!
    const disc = node.querySelector<HTMLElement>('.ask__flier-disc')!
    const ring = node.querySelector<HTMLElement>('.ask__flier-ring')!
    const s0 = f.from.w / w
    const x0 = f.from.x - left
    const y0 = f.from.y - top
    // the rig's tilt at take-off, eased away in flight (its shift is in header pixels)
    const m = new DOMMatrix(f.from.tilt === 'none' ? undefined : f.from.tilt)
    let landed = false
    let hit = false
    const frame = (t: number) => {
      const u = Math.min(1, t / HIT)
      // eases in and arrives still moving, so the landing is a hit
      const p = u * u * (2 - u)
      // a touch of arc: across a little ahead of down
      const px = ease(Math.min(1, u * 1.15))
      // after the hit: a damped dip below the spot and a squash-pop
      const v = clamp01((t - HIT) / (1 - HIT))
      const bump = Math.sin(Math.PI * v) * (1 - v)
      const s = s0 + (1 - s0) * p + POP * bump
      // wherever the face is now, relative to where it was at take-off
      const now = t > 0 ? faceSpot(f.box, f.face) : to
      // the pop grows from the face's centre, not the box's corner
      const x = x0 * (1 - px) + (now.x - to.x) * px + (1 - s) * cx * (t > HIT ? 1 : 0)
      const y = y0 * (1 - p) + (now.y - to.y) * p + DIP * bump + (1 - s) * cy * (t > HIT ? 1 : 0)
      node.style.transform = `translate(${x}px,${y}px) scale(${s})`
      if (!hit && t >= HIT) { hit = true; sfx.land(); haptic('tap') }
      const c = ease(clamp01((u - 0.1) / 0.9))
      const r = r0 + (r1 - r0) * c
      node.style.clipPath = `circle(${r}px at ${cx}px ${cy}px)`
      const k = 1 - Math.min(1, p)
      img.style.transform = `matrix(${1 + (m.a - 1) * k},${m.b * k},${m.c * k},${1 + (m.d - 1) * k},${(m.e / s0) * k},${(m.f / s0) * k})`
      // the avatar's disc and ring are its own size, never bigger, and
      // only come up as the circle closes in on them
      const fade = String(clamp01((u - 0.55) / 0.45))
      disc.style.opacity = fade
      ring.style.opacity = fade
    }
    frame(0)
    sfx.fly()
    const run = animate(0, 1, {
      duration: FLY_S, ease: 'linear', onUpdate: frame,
      onComplete: () => { if (!landed) { landed = true; onLanded() } },
    })
    return () => run.stop()
  }, [])

  return (
    <div ref={el} className="ask__flier" aria-hidden style={{ left, top, width: w, height: h }}>
      <span className="ask__flier-disc" style={{ left: cx - r1, top: cy - r1, width: to.d, height: to.d }} />
      <img src={POSE_SRC.think} alt="" width={420} height={490} draggable={false} />
      <span className="ask__flier-ring" style={{ left: cx - r1, top: cy - r1, width: to.d, height: to.d }} />
    </div>
  )
}

/** For the whole course: one question from each of the last few lessons
 *  learned, so the suggestions follow the learner up the stair. */
function generalSuggestions(p: Progress, lang: Lang): AskSuggestion[] {
  const nodes = lessonNodes()
  const done = nodes.filter((n) => p.completed[n.id])
  const pick = (done.length ? done.slice(-3) : nodes.slice(0, 1)).reverse()
  const out: AskSuggestion[] = []
  for (const n of pick) {
    const l = getLesson(n.lessonId!, lang)
    for (const a of l?.ask ?? []) {
      out.push(a)
      if (done.length) break
    }
  }
  return out
}

/** One message. Memoised: while a reply types, only the live row's `m`
 *  changes, so the rest of the thread is not re-rendered 60 times a second. */
const MsgRow = memo(function MsgRow({ m, calm, onStep, onGrown }: {
  m: Msg
  calm: boolean
  onStep: () => void
  onGrown: () => void
}) {
  return (
    /* No layout animation here: a gliding row passes over the new one
       as it arrives, so the question would slide across the reply.
       Earlier rows move before paint; only the new row fades up. */
    <motion.div className={`msg-row msg-row--${m.who}`}
      // a reply is the thinking bubble itself, grown: no fade
      initial={m.who === 'siraj' ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
      {m.who === 'siraj' && <span className={`ask__face${m.live ? ' ask__face--talk' : ''}`} aria-hidden />}
      <GrowBubble className={`msg msg--${m.who}`} from={m.live ? m.grow : undefined} calm={calm}
        onStep={onStep} onGrown={onGrown}>
        {m.who === 'siraj' ? <Answer text={m.text} full={m.full} sources={m.sources} live={m.live} /> : m.text}
        {m.who === 'siraj' && m.origin && <Origin origin={m.origin} text={m.full ?? m.text} waiting={m.live} />}
        {!!m.sources?.length && (
          <div className={`msg__src${m.live ? ' is-waiting' : ''}`}>
            {m.sources.map((s) => (
              <a key={s.url} className="msg__srclink" href={s.url} target="_blank" rel="noreferrer noopener">
                {sourceLabel(s.title)}
              </a>
            ))}
          </div>
        )}
      </GrowBubble>
    </motion.div>
  )
})

/** A bubble that, given `from`, starts at that size and springs out to
 *  its natural size, then calls onGrown. Real width and height are
 *  animated, not a scale transform, so the border and corners never
 *  stretch and nothing is drawn over its neighbours. */
function GrowBubble({ from, calm, onStep, onGrown, className, children }: {
  from?: { w: number; h: number }
  calm: boolean
  onStep: () => void
  onGrown: () => void
  className: string
  children: ReactNode
}) {
  const el = useRef<HTMLDivElement>(null)
  const done = useRef(false)

  useLayoutEffect(() => {
    const node = el.current
    if (!from || !node || done.current) return
    if (calm) { done.current = true; onGrown(); return }
    // the finished text is already laid out (invisibly), so this is the
    // bubble's true final size
    const w = node.offsetWidth
    const h = node.offsetHeight
    node.style.overflow = 'hidden'
    node.style.width = `${from.w}px`
    node.style.height = `${from.h}px`
    // typing starts once the bubble has reached its size, during the
    // bounce rather than after its last wobble. Keyed to the real size,
    // not a timer, so a slow frame can never start it in a small bubble.
    let typing = false
    const begin = () => { if (!typing) { typing = true; onGrown() } }
    const run = animate(node, { width: [from.w, w], height: [from.h, h] }, {
      type: 'spring', bounce: 0.42, duration: 0.6,
      onUpdate: () => {
        onStep()
        if (node.offsetHeight >= h * 0.98 && node.offsetWidth >= w * 0.98) begin()
      },
      onComplete: () => {
        done.current = true
        reset()
        onStep()
        begin()
      },
    })
    function reset() {
      node!.style.width = ''
      node!.style.height = ''
      node!.style.overflow = ''
    }
    // an interrupted grow (StrictMode's double effect in dev) leaves the
    // bubble at its natural size, so the rerun measures it correctly
    return () => { run.stop(); if (!done.current) reset() }
  }, [])

  return <div ref={el} className={className}>{children}</div>
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

// memoised so the invisible full-length ghost is parsed once, not on every typed tick
const Segments = memo(function Segments({ text, sources, live }: { text: string; sources?: Msg['sources']; live?: boolean }) {
  return (
    <>
      {parseAnswer(text, sources, { streaming: live }).map((p, i) =>
        p.k === 'link' ? (
          <a key={i} className="msg__link" href={p.url} target="_blank" rel="noreferrer noopener" dir="auto">{p.label}</a>
        ) : p.k === 'bold' ? (
          <b key={i}>{p.v}</b>
        ) : (
          <RichText key={i} text={p.v} />
        ),
      )}
    </>
  )
})

/** Says where a reply came from, as the reference pack requires: an AI
 *  answer says it is one, and when it quotes a verse or hadith, that the
 *  coloured text is the quotation and the rest is explanation. A bundled
 *  answer says it was prepared in advance. */
function Origin({ origin, text, waiting }: { origin: ReplyOrigin; text: string; waiting?: boolean }) {
  const t = useT()
  const quotes = origin === 'ai' && quoteRuns(text).some((r) => r.quote)
  return (
    <p className={`msg__origin${waiting ? ' is-waiting' : ''}`}>
      {origin === 'prepared' ? t.originPrepared : quotes ? t.originAiQuoted : t.originAi}
    </p>
  )
}

/** "Sahih al-Bukhari 8 - Belief - Sunnah.com - Sayings and..." -> "Sahih al-Bukhari 8" */
function sourceLabel(title: string): string {
  const head = title.split(/\s+[-|\u2013]\s+/)[0].trim()
  return head.length > 32 ? head.slice(0, 31).trimEnd() + '…' : head
}
