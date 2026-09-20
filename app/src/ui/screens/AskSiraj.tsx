import { useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Lesson } from '../../core/types'
import { askSiraj } from '../../core/ai/askSiraj'
import { conceptsFromLesson } from '../../core/ai/systemPrompt'
import { Siraj } from '../components/Siraj'
import { Button } from '../components/Button'
import { useApp } from '../state'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

interface Msg {
  id: number
  who: 'me' | 'siraj' | 'err'
  text: string
  sources?: { title: string; url: string }[]
}

export function AskSiraj({
  lesson, unitTitle, onFinish,
}: {
  lesson: Lesson
  unitTitle: string
  onFinish: () => void
}) {
  const { progress, dispatch } = useApp()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [used, setUsed] = useState<string[]>([])
  const thread = useRef<HTMLDivElement>(null)
  const seq = useRef(0)

  const left = lesson.ask.filter((s) => !used.includes(s.q))

  // Scroll before the browser paints, not after: a post-paint smooth scroll
  // shows one frame at the old offset, which reads as the thread lurching.
  useLayoutEffect(() => {
    const el = thread.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs, busy])

  const push = (m: Omit<Msg, 'id'>) => setMsgs((prev) => [...prev, { ...m, id: seq.current++ }])

  const markCurious = () => {
    if (!progress.achievements.includes('curious')) dispatch({ type: 'grant', id: 'curious' })
  }

  /* A suggested question answers instantly from bundled text - no
     network, no spend, works offline. Only free-typed questions hit the API. */
  const askCanned = (q: string, a: string) => {
    primeAudio(); sfx.tap(); haptic('tap')
    setUsed((u) => [...u, q])
    push({ who: 'me', text: q })
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      push({ who: 'siraj', text: a })
      sfx.snap()
      markCurious()
    }, 620)
  }

  const askLive = async () => {
    const q = text.trim()
    if (!q || busy) return
    primeAudio(); sfx.tap(); haptic('tap')
    setText('')
    push({ who: 'me', text: q })
    setBusy(true)
    const res = await askSiraj(q, {
      unitTitle,
      lessonTitle: lesson.title,
      taughtConcepts: conceptsFromLesson(lesson.cards),
    })
    setBusy(false)
    if (res.ok && res.answer) {
      push({ who: 'siraj', text: res.answer, sources: res.sources })
      sfx.snap()
      markCurious()
    } else {
      push({ who: 'err', text: res.message ?? 'تعذّر الحصول على إجابة.' })
      sfx.wrong()
    }
  }

  return (
    <>
      <div className="ask__head">
        <Siraj mood="think" size={72} />
        <div className="bubble bubble--side" style={{ flex: 1, fontSize: '1rem' }}>
          شيءٌ لم يتّضح في <b style={{ color: 'var(--orange)' }}>{lesson.title}</b>؟ اسألني.
        </div>
      </div>

      <span className="ask__fade" aria-hidden />

      <div className="ask__thread" ref={thread}>
        {msgs.map((m) => (
          /* `layout` lets earlier messages glide upward as a new one takes
             its space, rather than teleporting by its full height */
          <motion.div key={m.id} layout className={`msg msg--${m.who}`}
            initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ layout: { type: 'spring', stiffness: 420, damping: 38 }, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}>
            {m.text}
            {!!m.sources?.length && (
              <div className="msg__src">
                {m.sources.map((s) => (
                  <a key={s.url} className="msg__srclink" href={s.url} target="_blank" rel="noreferrer noopener">
                    {s.title}
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        ))}
        <AnimatePresence>
          {busy && (
            <motion.div className="thinking" layout
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, borderWidth: 0, transition: { duration: 0.16 } }}
              style={{ overflow: 'hidden' }}>
              <span /><span /><span />
            </motion.div>
          )}
        </AnimatePresence>
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
              onClick={() => askCanned(s.q, s.a)} disabled={busy}>
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
          disabled={busy}
        />
        <button className="ask__send" onClick={askLive} disabled={busy || !text.trim()} aria-label="إرسال">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12 H5 M11 6 L5 12 L11 18" />
          </svg>
        </button>
      </div>

      <p className="ask__note">يجيب سراج نقلًا عن مصادر موثوقة فقط.</p>

      <div className="ask__finish">
        <Button block tone={msgs.length ? 'primary' : 'quiet'} onClick={onFinish}>
          {msgs.length ? 'تابع' : 'تخطّي'}
        </Button>
      </div>
    </>
  )
}
