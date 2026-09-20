import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Star, Droplet, Sun, Crescent, Lantern } from '../icons/SirajIcons'
import { useProgress } from '../state'
import { currentOil, currentStreak, MAX_OIL } from '../../core/engine/progress'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

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

export function StatBar({ onOpenOil }: { onOpenOil?: () => void }) {
  const p = useProgress()
  const streak = currentStreak(p)
  const oil = currentOil(p)
  return (
    <header className="statbar">
      <Stat icon={<Flame size={22} />} value={streak} tone="flame" label="أيام متتالية" />
      <Stat icon={<Star size={22} />} value={p.xp} tone="star" label="نقاط الخبرة" />
      <button
        className="stat stat--oil"
        onClick={onOpenOil}
        onPointerDown={() => { primeAudio(); sfx.tap(); haptic('tap') }}
        aria-label={`قطرات الزيت: ${oil} من ${MAX_OIL}`}
      >
        <span className="stat__icon"><Droplet size={22} /></span>
        <span className="stat__val num">{oil}</span>
      </button>
    </header>
  )
}

function Stat({ icon, value, tone, label }: { icon: React.ReactNode; value: number; tone: string; label: string }) {
  const prev = useRef(value)
  const bumped = value > prev.current
  useEffect(() => { prev.current = value }, [value])
  return (
    <div className={`stat stat--${tone}`} title={label}>
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

const TABS: { id: Tab; label: string; Icon: typeof Sun }[] = [
  { id: 'path', label: 'الرحلة', Icon: Sun },
  { id: 'review', label: 'المراجعة', Icon: Crescent },
  { id: 'ask', label: 'اسأل سراج', Icon: Lantern },
  { id: 'wins', label: 'الإنجازات', Icon: Star },
]

export function NavBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const p = useProgress()
  return (
    <nav className="nav" aria-label="التنقّل">
      {TABS.map(({ id, label, Icon }) => (
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
        aria-label="ملفي"
        aria-current={tab === 'me' ? 'page' : undefined}
      >
        {tab === 'me' && (
          <motion.span layoutId="nav-pill" className="nav__pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
        )}
        <span className="nav__avatar">{(p.name?.trim()?.[0] ?? 'س')}</span>
      </button>
    </nav>
  )
}
