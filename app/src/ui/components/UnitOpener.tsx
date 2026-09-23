import { useEffect, useState } from 'react'
import { m as motion } from 'framer-motion'
import { UNITS } from '../../core/content/path'
import type { Unit } from '../../core/types'
import { useCalmMotion } from '../state'
import { Icon, Star } from '../icons/SirajIcons'
import { Siraj } from './Siraj'
import { Button } from './Button'
import { Burst, Shockwave } from './Burst'
import { toAr } from '../screens/Home'
import { sfx } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

/* Crossing into a new unit. The camera has just carried the learner up the
   road; now a gate in the new unit's colour swings open on its title, the
   row of units fills in one more, and Siraj cheers. Its own chunk: it is
   fetched while the camera is still climbing, long before it is needed.

   Like the result screen, it lands in beats rather than all at once:
   gate, doors, light, name, Siraj, button. */
export function UnitOpener({ from, to, onDone }: { from: Unit; to: Unit; onDone: () => void }) {
  const calm = useCalmMotion()
  const [beat, setBeat] = useState(calm ? 5 : 0)

  useEffect(() => {
    if (calm) {
      sfx.fanfare()
      haptic('win')
      return
    }
    const t = [
      setTimeout(() => { setBeat(1); sfx.fanfare(); haptic('win') }, 420),
      setTimeout(() => setBeat(2), 700),
      setTimeout(() => setBeat(3), 1050),
      setTimeout(() => { setBeat(4); sfx.chirp() }, 1650),
      setTimeout(() => setBeat(5), 2050),
    ]
    return () => t.forEach(clearTimeout)
  }, [calm])

  // on a keyboard, Enter does what the one big button does
  useEffect(() => {
    if (beat < 5) return
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      e.preventDefault()
      onDone()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [beat, onDone])

  const cls = [
    'opener',
    beat >= 1 && 'is-open',
    beat >= 2 && 'is-lit',
    beat >= 3 && 'is-named',
    beat >= 4 && 'is-cheer',
    beat >= 5 && 'is-ready',
  ].filter(Boolean).join(' ')

  return (
    <motion.div className={cls} role="dialog" aria-modal="true" aria-labelledby="opener-title"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.2, ease: [0.32, 0, 0.67, 0] } }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}>
      <div className="opener__stage">
        <div className="opener__crown">
          {!calm && <span className="opener__rays" aria-hidden />}
          <span className="opener__glow" aria-hidden />
          <div className={`opener__gate unitcard--${to.tone}`}>
            <div className="opener__arch" aria-hidden>
              <span className="opener__light" />
              <span className="opener__icon"><Icon name={to.icon} size={54} /></span>
              <span className="opener__door opener__door--l"><Star size={26} /></span>
              <span className="opener__door opener__door--r"><Star size={26} /></span>
            </div>
          </div>
          {beat >= 2 && !calm && <>
            <Shockwave />
            <Burst count={40} flavour="gold" spread={240} />
            <Burst count={20} flavour="mixed" spread={170} className="burst--late" />
          </>}
        </div>

        <div className="opener__text">
          <span className="opener__kicker">وحدة جديدة</span>
          <h2 id="opener-title" className="opener__title">{to.title}</h2>
          <span className="opener__sub">الوحدة {toAr(to.index + 1)} · {to.subtitle}</span>
        </div>

        <div className="opener__track" aria-label={`أتممت ${toAr(to.index)} من ${toAr(UNITS.length)} وحدات`}>
          {UNITS.map((u) => (
            <span key={u.id} className={[
              'opener__pip',
              u.index < to.index && 'is-done',
              u.index === from.index && 'is-just',
              u.index === to.index && 'is-next',
            ].filter(Boolean).join(' ')}>
              <span className="opener__fill" />
              <Icon name={u.icon} size={15} />
            </span>
          ))}
        </div>
      </div>

      <div className="opener__host">
        {/* cheering from the first frame, held still until he rises (app.css),
            so his drawing never swaps on screen */}
        <Siraj mood="cheer" size={84} />
        <div className="bubble bubble--side opener__bubble">
          <b>أحسنت!</b> اكتملت وحدة «{from.title}». هيا نصعد إلى {to.subtitle}.
        </div>
      </div>

      <div className="opener__action">
        <Button block onClick={onDone} tabIndex={beat >= 5 ? 0 : -1}>هيا نصعد</Button>
      </div>
    </motion.div>
  )
}
