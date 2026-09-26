import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { Flame, Star, Sun, Crescent, Lantern } from '../icons/SirajIcons'
import { useLang, useProgress, useSetLanguage, useT } from '../state'
import { currentStreak } from '../../core/engine/progress'
import { isLang } from '../../core/i18n'
import { LANGS, langById } from '../languages'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'
import { Avatar, profileLabel } from './Profile'

const WORDMARK = `${import.meta.env.BASE_URL}img/siraj-wordmark-ar.svg`
const PEEK = `${import.meta.env.BASE_URL}img/siraj-peek.webp`

/* ---------------- a number that rolls up instead of snapping ---------------- */

export function Counter({ value, duration = 900, className = '', suffix = '' }: { value: number; duration?: number; className?: string; suffix?: string }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    const b = value
    if (a === b) return
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // ease-out-quint: fast then settles, matching the visual easing
      const e = 1 - Math.pow(1 - t, 5)
      setShown(Math.round(a + (b - a) * e))
      if (t < 1) raf = requestAnimationFrame(tick)
      else from.current = b
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  // Western digits for stats: they are far quicker to scan at a glance,
  // and .num isolates them so they read LTR inside the RTL layout.
  // the suffix lives INSIDE the isolate, or RTL reordering throws it to the far side
  return <span className={`num ${className}`}>{shown}{suffix}</span>
}

/* ---------------- the stat bar ---------------- */

export function StatBar({ wordmark = true }: { wordmark?: boolean }) {
  const t = useT()
  return (
    <header className="statbar">
      {wordmark && <img className="statbar__wordmark" src={WORDMARK} alt={t.appName} />}
      <StatRow />
    </header>
  )
}

/** flame, star and the language: shared by the phone's top bar and the desktop rail */
export function StatRow() {
  const p = useProgress()
  const t = useT()
  const streak = currentStreak(p)
  return (
    <div className="statbar__stats">
      <Stat icon={<Flame size={24} />} value={streak} tone="flame" label={t.streak} />
      <Stat icon={<Star size={24} />} value={p.xp} tone="star" label={t.xp} />
      <LangButton />
    </div>
  )
}

/* ---------------- the language, one tap from anywhere ----------------
   Where the oil drop used to sit. The flag is the current language; a tap
   opens the choice. Switching keeps every point, day and step. */

function LangButton() {
  const t = useT()
  const lang = useLang()
  const setLanguage = useSetLanguage()
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const current = langById(lang)

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc) }
  }, [open])

  const choose = (id: string) => {
    setOpen(false)
    if (id === lang || !isLang(id)) return
    sfx.select()
    haptic('tap')
    void setLanguage(id)
  }

  return (
    <div className="statlang" ref={wrap}>
      <button
        className={`stat stat--lang${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        onPointerDown={() => { primeAudio(); sfx.tap(); haptic('tap') }}
        aria-label={t.languageAria(current.label)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="stat__flag"><current.Flag /></span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="langpop" role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12, ease: [0.4, 0, 1, 1] } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
            {LANGS.filter((l) => l.ready).map((l) => (
              <button key={l.id} role="menuitemradio" aria-checked={l.id === lang}
                className={`langpop__item${l.id === lang ? ' is-on' : ''}`}
                onClick={() => choose(l.id)}>
                <span className="lang__flag"><l.Flag /></span>
                <span lang={l.id} dir="auto">{l.label}</span>
                {'beta' in l && l.beta && <span className="lang__beta">{t.beta}</span>}
              </button>
            ))}
            <p className="langpop__note">{t.languageNote}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Stat({ icon, value, tone, label }: { icon: React.ReactNode; value: number; tone: string; label: string }) {
  const prev = useRef(value)
  const bumped = value > prev.current
  useEffect(() => { prev.current = value }, [value])
  return (
    // a streak of zero reads as "not lit yet", not as a broken counter
    <div className={`stat stat--${tone}${tone === 'flame' && value === 0 ? ' is-idle' : ''}`} title={label} aria-label={`${label}: ${value}`}>
      <motion.span
        className="stat__icon"
        animate={bumped ? { scale: [1, 1.45, 1], rotate: [0, -12, 0] } : {}}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {icon}
      </motion.span>
      <Counter value={value} className="stat__val" />
    </div>
  )
}

/* ---------------- lesson progress ---------------- */

export function ProgressBar({ value, tone = 'good' }: { value: number; tone?: 'good' | 'gold' }) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div className={`pbar pbar--${tone}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className="pbar__fill"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.7 }}
      >
        <span className="pbar__gloss" />
      </motion.div>
    </div>
  )
}

/* ---------------- bottom navigation ---------------- */

export type Tab = 'path' | 'review' | 'ask' | 'wins' | 'me'

const TABS: { id: Exclude<Tab, 'me'>; Icon: typeof Sun }[] = [
  { id: 'path', Icon: Sun },
  { id: 'review', Icon: Crescent },
  { id: 'ask', Icon: Lantern },
  { id: 'wins', Icon: Star },
]

export function NavBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const p = useProgress()
  const t = useT()
  return (
    <nav className="nav" aria-label={t.nav}>
      {TABS.map(({ id, Icon }) => ({ id, label: t.tabs[id], Icon })).map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`nav__item${tab === id ? ' is-on' : ''}`}
          onPointerDown={() => { primeAudio(); sfx.tap(); haptic('tap') }}
          onClick={() => onTab(id)}
          aria-current={tab === id ? 'page' : undefined}
          aria-label={label}
        >
          {tab === id && (
            <motion.span
              layoutId="nav-pill"
              className="nav__pill"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
          )}
          <motion.span
            className="nav__ico"
            animate={{ scale: tab === id ? 1.06 : 1, y: tab === id ? -1 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          >
            <Icon size={26} />
          </motion.span>
        </button>
      ))}
      <button
        className={`nav__item nav__item--me${tab === 'me' ? ' is-on' : ''}`}
        onPointerDown={() => { primeAudio(); sfx.tap(); haptic('tap') }}
        onClick={() => onTab('me')}
        aria-label={profileLabel(p.name, t)}
        aria-current={tab === 'me' ? 'page' : undefined}
      >
        {tab === 'me' && (
          <motion.span layoutId="nav-pill" className="nav__pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
        )}
        <Avatar id={p.avatar} name={p.name} size={30} className="nav__avatar" />
      </button>
    </nav>
  )
}

/* ---------------- the desktop sidebar ----------------
   The same five destinations as the bottom bar, stood up the side of the
   screen with their names, the way Duolingo does it on the web. On tablets
   it narrows to icons only (CSS hides the labels). */

const SIDE_TONES: Record<Tab, string> = {
  path: 'var(--orange)',
  review: 'var(--info)',
  ask: 'var(--orange-deep)',
  wins: 'var(--yellow-deep)',
  me: 'var(--maroon)',
}

export function SideNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const p = useProgress()
  const t = useT()
  // the last tab is the learner: their picture, and their own name
  const items: { id: Tab; label: string; Icon: typeof Sun | null }[] = [
    ...TABS.map(({ id, Icon }) => ({ id, label: t.tabs[id], Icon })),
    { id: 'me', label: profileLabel(p.name, t), Icon: null },
  ]
  return (
    <nav className="side" aria-label={t.nav}>
      <div className="side__brand">
        <img className="side__wordmark" src={WORDMARK} alt={t.appName} />
        {/* Siraj peeks over the edge beside his name (wide sidebar only) */}
        <img className="side__peek" src={PEEK} alt="" width={83} height={80} />
      </div>
      <div className="side__items">
        {items.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`side__item${tab === id ? ' is-on' : ''}`}
            style={{ ['--tone' as string]: SIDE_TONES[id] }}
            onPointerDown={() => { primeAudio(); sfx.tap(); haptic('tap') }}
            onClick={() => onTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            title={label}
          >
            {tab === id && (
              <motion.span layoutId="side-pill" className="side__pill"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            <span className="side__ico">
              {Icon ? <Icon size={30} /> : <Avatar id={p.avatar} name={p.name} size={32} className="nav__avatar" />}
            </span>
            <span className="side__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
