import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { GlossSeg } from '../../core/types'
import { quoteRuns } from '../../core/quoteRuns'
import { useApp, useT } from '../state'

/* ============================================================
   What an Arabic word means, for the English learner, the way
   quran.com shows it: hover a word (or tap it on a phone) and a
   small bubble above it says what it means. The bubble follows the
   mouse along the word. A phrase whose words mean little alone is
   one piece, and lights up whole.

   The bubble is portalled to <body> with position: fixed: inside
   the lesson a fixed box would resolve against the transformed
   panel (AGENTS.md section 9), and a card's edge would clip it.
   It moves by transform only.
   ============================================================ */

interface Shown {
  /** which piece, so it can light up */
  key: string
  en: string
  tr?: string
  el: HTMLElement
  x: number
}

const SEEN_KEY = 'siraj.glossSeen'

/** has this learner opened a meaning before? Then the hint can rest. */
function seenBefore(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* private mode: the hint just stays */ }
}

/** the rectangle of a (maybe wrapped) piece that holds this point, else its first line */
function lineRect(el: HTMLElement, y?: number): DOMRect {
  const rects = [...el.getClientRects()]
  return (y !== undefined && rects.find((r) => y >= r.top - 2 && y <= r.bottom + 2)) || rects[0] || el.getBoundingClientRect()
}

function usePop() {
  const [shown, setShown] = useState<Shown | null>(null)
  const pop = useRef<HTMLDivElement>(null)
  const lastY = useRef<number | undefined>(undefined)
  const kind = useRef('')

  // place the bubble over the piece, at the pointer's x, kept on screen
  const place = (s: Shown | null, x = s?.x) => {
    const el = pop.current
    if (!el || !s || x === undefined) return
    const r = lineRect(s.el, lastY.current)
    const w = el.offsetWidth
    const pad = 10
    const cx = Math.min(Math.max(x, pad + w / 2), window.innerWidth - pad - w / 2)
    el.style.transform = `translate3d(${Math.round(cx)}px,${Math.round(r.top)}px,0) translate(-50%,calc(-100% - 9px))`
    el.style.setProperty('--ax', `${Math.round(x - cx)}px`)
  }
  useLayoutEffect(() => place(shown), [shown])

  // a tap anywhere else, a scroll or Escape puts it away
  useEffect(() => {
    if (!shown) return
    const away = (e: Event) => {
      if (e.type === 'pointerdown' && shown.el.contains(e.target as Node)) return
      setShown(null)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setShown(null)
    document.addEventListener('pointerdown', away, true)
    window.addEventListener('scroll', away, true)
    window.addEventListener('resize', away)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('pointerdown', away, true)
      window.removeEventListener('scroll', away, true)
      window.removeEventListener('resize', away)
      document.removeEventListener('keydown', key)
    }
  }, [shown])

  const show = (key: string, en: string, tr: string | undefined, el: HTMLElement, x: number, y?: number) => {
    lastY.current = y
    if (!shown) markSeen()
    setShown({ key, en, tr, el, x })
  }

  /** the handlers one piece needs */
  const bind = (key: string, en: string, tr?: string) => ({
    tabIndex: 0,
    role: 'button' as const,
    'aria-label': en,
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') show(key, en, tr, e.currentTarget, e.clientX, e.clientY)
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return
      if (shown?.key !== key) return show(key, en, tr, e.currentTarget, e.clientX, e.clientY)
      lastY.current = e.clientY
      place(shown, e.clientX)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse') setShown((s) => (s?.key === key ? null : s))
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => { kind.current = e.pointerType },
    // touch, pen and keyboard: a tap opens it over the middle of the piece, a second tap closes it
    onClick: (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget
      const mouse = kind.current === 'mouse' && e.detail > 0
      kind.current = ''
      if (mouse) return show(key, en, tr, el, e.clientX, e.clientY)
      if (shown?.key === key) return setShown(null)
      const y = e.detail ? e.clientY : undefined
      const r = lineRect(el, y)
      show(key, en, tr, el, r.left + r.width / 2, y)
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.click()
      }
    },
  })

  const bubble = shown
    ? createPortal(
        <div ref={pop} className="glosspop" role="tooltip">
          {shown.tr && <span className="glosspop__tr">{shown.tr}</span>}
          <span className="glosspop__en">{shown.en}</span>
        </div>,
        document.body,
      )
    : null

  return { shown, bind, bubble }
}

/**
 * An Arabic text read piece by piece. `field` picks what is written:
 * the Arabic itself, or (on a recite card) how each piece is said.
 */
export function GlossText({ segs, field = 'ar', className }: { segs: GlossSeg[]; field?: 'ar' | 'tr'; className?: string }) {
  const { shown, bind, bubble } = usePop()
  const ar = field === 'ar'
  return (
    <p className={`gloss${ar ? ' gloss--ar' : ' gloss--tr'}${className ? ' ' + className : ''}`}
      lang={ar ? 'ar' : 'en'} dir={ar ? 'rtl' : 'ltr'}>
      {segs.map((s, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className={`gloss__w${shown?.key === String(i) ? ' is-on' : ''}`}
            {...bind(String(i), s.en, ar ? s.tr : undefined)}>
            {ar ? s.ar : s.tr}
          </span>
        </Fragment>
      ))}
      {bubble}
    </p>
  )
}

/** one word in English text that is really Arabic: ﷺ */
function GlossWord({ children, en, tr }: { children: ReactNode; en: string; tr?: string }) {
  const { shown, bind, bubble } = usePop()
  return (
    <span className={`gloss__w gloss__w--inline${shown ? ' is-on' : ''}`} {...bind('w', en, tr)}>
      {children}
      {bubble}
    </span>
  )
}

/** "Hover over (or tap) any Arabic word": until the learner has done it once */
export function GlossHint() {
  const t = useT()
  const [show] = useState(() => !seenBefore())
  if (!show) return null
  return (
    <p className="glosshint">
      <span className="glosshint__hover">{t.glossHintHover}</span>
      <span className="glosshint__tap">{t.glossHintTap}</span>
    </p>
  )
}

/**
 * Running text from a lesson or an answer: an ayah or hadith quoted in
 * it takes its own colour, and in English ﷺ tells what it means.
 */
export function RichText({ text }: { text: string }) {
  const { progress } = useApp()
  const t = useT()
  const en = progress.language === 'en'
  const salla = (s: string, k: number) => {
    if (!en || !s.includes('ﷺ')) return s
    return s.split('ﷺ').map((part, i) => (
      <Fragment key={`${k}-${i}`}>
        {i > 0 && <GlossWord en={t.sallallahu.en} tr={t.sallallahu.tr}>ﷺ</GlossWord>}
        {part}
      </Fragment>
    ))
  }
  return (
    <>
      {quoteRuns(text).map((r, i) =>
        r.quote ? <span key={i} className="inq">{salla(r.text, i)}</span> : <Fragment key={i}>{salla(r.text, i)}</Fragment>,
      )}
    </>
  )
}
