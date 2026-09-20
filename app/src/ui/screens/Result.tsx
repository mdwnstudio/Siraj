import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { LessonOutcome, ApplyResult } from '../../core/engine/progress'
import { achievementById } from '../../core/engine/progress'
import { Icon, Star, Flame, Sparkle } from '../icons/SirajIcons'
import { Siraj } from '../components/Siraj'
import { Button } from '../components/Button'
import { Burst, Shockwave } from '../components/Burst'
import { Counter } from '../components/Bars'
import { useCalmMotion } from '../state'
import { sfx } from '../../platform/sound'
import { haptic } from '../../platform/haptics'
import { toAr } from './Home'

/* The payoff. Everything arrives in sequence rather than at once -
   the medal lands, then the stats, then the streak. A staggered
   reveal reads as "look what you did", a simultaneous one reads as
   a dialog box. */
export function Result({
  outcome, applied, onDone,
}: {
  outcome: LessonOutcome
  applied: ApplyResult
  onDone: () => void
}) {
  const calm = useCalmMotion()
  const [beat, setBeat] = useState(0)
  const accuracy = Math.round((outcome.correct / Math.max(1, outcome.total)) * 100)
  const perfect = accuracy === 100

  useEffect(() => {
    sfx.win()
    haptic('win')
    const t1 = setTimeout(() => setBeat(1), 520)
    const t2 = setTimeout(() => { setBeat(2); sfx.tick(2) }, 980)
    const t3 = setTimeout(() => { setBeat(3); if (applied.streakBumped) { sfx.tick(4); haptic('correct') } }, 1380)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const earned = applied.newAchievements.map(achievementById).filter(Boolean)

  return (
    <div className={`result${calm ? ' calm' : ''}`}>
      <div className="result__stage">
        {!calm && <span className="result__rays" />}
        {!calm && <span className="lightsweep" />}
        {!calm && <Shockwave />}
        {!calm && <Burst count={44} flavour="gold" spread={280} />}
        {!calm && <Burst count={22} flavour="mixed" spread={210} className="burst--late" />}

        <motion.div
          initial={{ scale: 0.2, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14, mass: 0.9 }}
          style={{ display: 'grid', placeItems: 'center', gap: 18 }}
        >
          <div className="result__crest">
            <span className="result__orbit result__orbit--a"><Star size={18} /></span>
            <span className="result__orbit result__orbit--b"><Sparkle size={16} /></span>
            <span className="result__orbit result__orbit--c"><Star size={13} /></span>
            <div className="medal">
              {perfect ? <Sparkle size={56} /> : <Star size={52} />}
            </div>
          </div>
          <span className="result__kicker">أضاءت درجة جديدة</span>
          <h1 className="result__title">{perfect ? 'بلا خطأ!' : 'أحسنت!'}</h1>
        </motion.div>

        <motion.p className="result__sub"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: beat >= 1 ? 1 : 0, y: beat >= 1 ? 0 : 12 }}
          transition={{ duration: 0.34, ease: [0.23, 1, 0.32, 1] }}>
          {perfect
            ? 'أجبتَ عن كل شيء إجابةً صحيحة. درجةٌ أخرى خلفك.'
            : `أصبتَ ${toAr(outcome.correct)} من ${toAr(outcome.total)}. الدرجة التالية مفتوحة.`}
        </motion.p>

        <motion.div className="stats"
          initial={{ opacity: 0, y: 22 }} animate={{ opacity: beat >= 2 ? 1 : 0, y: beat >= 2 ? 0 : 22 }}
          transition={{ duration: 0.42, ease: [0.34, 1.56, 0.64, 1] }}>
          <div className="statcard statcard--xp">
            <div className="statcard__head">نقاط</div>
            <div className="statcard__body"><Star size={17} /><Counter value={beat >= 2 ? outcome.xp : 0} /></div>
          </div>
          <div className="statcard statcard--acc">
            <div className="statcard__head">الدقّة</div>
            <div className="statcard__body"><Counter value={beat >= 2 ? accuracy : 0} suffix="٪" /></div>
          </div>
          <div className="statcard statcard--time">
            <div className="statcard__head">الزمن</div>
            <div className="statcard__body num">{fmt(outcome.seconds)}</div>
          </div>
        </motion.div>

        {applied.streakBumped && (
          <motion.div className="streakrow"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}>
            <motion.span animate={beat >= 3 ? { scale: [1, 1.4, 1], rotate: [0, -12, 0] } : {}} transition={{ duration: 0.6, delay: 0.1 }}>
              <Flame size={24} />
            </motion.span>
            <span>{applied.progress.streak === 1 ? 'يومٌ متتالٍ' : `${toAr(applied.progress.streak)} أيام متتالية`}</span>
          </motion.div>
        )}

        {!!earned.length && (
          <motion.div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 6 }}
            initial={{ opacity: 0 }} animate={{ opacity: beat >= 3 ? 1 : 0 }} transition={{ delay: 0.15 }}>
            {earned.map((a) => (
              <motion.div key={a!.id} className="badge is-won" style={{ padding: '10px 14px' }}
                initial={{ scale: 0.4, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 16 }}>
                <span className="badge__ring" style={{ width: 40, height: 40 }}><Icon name={a!.icon} size={19} /></span>
                <span className="badge__t">{a!.title}</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div style={{ position: 'absolute', bottom: -6, insetInlineStart: 4, pointerEvents: 'none' }}
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 220, damping: 18 }}>
          <Siraj mood="cheer" size={112} />
        </motion.div>
      </div>

      <motion.div className="result__action"
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: beat >= 2 ? 1 : 0, y: beat >= 2 ? 0 : 18 }}>
        <Button block tone="gold" onClick={onDone}>تابِع الصعود</Button>
      </motion.div>
    </div>
  )
}

function fmt(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}
