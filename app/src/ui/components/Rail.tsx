import { m as motion } from 'framer-motion'
import { useApp, useT } from '../state'
import { UNIT_OF, PATH, unitText } from '../../core/content/path'
import { getLesson } from '../../core/content/lessons'
import { currentNodeId, isCompleted, isUnlocked } from '../../core/engine/pathView'
import { ACHIEVEMENTS, achievementText, levelFromXp } from '../../core/engine/progress'
import { Icon, Lantern } from '../icons/SirajIcons'
import { Button } from './Button'
import { ProgressBar, StatRow, type Tab } from './Bars'
import { Siraj } from './Siraj'
import { POSE_SRC } from './SirajPose'

/* ---------------- the desktop rail ----------------
   What the phone shows in its top bar and behind taps, laid out as cards
   beside the content so a wide screen is never an empty field: where you
   are, what comes next, how far you have climbed, and a way to ask. */

export function Rail({ tab, onTab, onStart }: {
  tab: Tab
  onTab: (t: Tab) => void
  onStart: (nodeId: string) => void
}) {
  const { progress } = useApp()
  const t = useT()
  const lang = progress.language
  const nodeId = currentNodeId(progress)
  const node = PATH.find((n) => n.id === nodeId)!
  const unit = UNIT_OF.get(nodeId)!
  const lesson = node.lessonId ? getLesson(node.lessonId, lang) : undefined
  const unitDone = unit.nodes.filter((n) => isCompleted(progress, n.id)).length
  const finished = isCompleted(progress, nodeId)
  const { level, into, span } = levelFromXp(progress.xp)
  const won = progress.achievements

  const cta = () => {
    if (node.kind === 'lesson' && isUnlocked(progress, nodeId) && !finished) onStart(nodeId)
    else onTab('path')
  }

  return (
    <aside className="rail scroll" aria-label={t.railAria}>
      <div className="rail__stats"><StatRow /></div>

      {/* where you are on the stair, and the one tap that continues it */}
      <motion.section className={`rcard rcard--next unitcard--${unit.tone}`}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="rcard__kicker">{t.unitKicker(unit.index + 1, unitText(unit, lang).title)}</div>
        <div className="rcard--next__row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="rcard--next__title">
              {finished ? t.allDone : lesson?.title ?? t.roadReward}
            </div>
            <div className="rcard--next__meta">
              {finished
                ? t.allPillars
                : lesson
                  ? t.railShape(lesson.cards.length, lesson.exercises.length)
                  : t.openFromRoad}
            </div>
          </div>
          <Siraj mood="wave" size={64} />
        </div>
        <div className="rcard--next__bar">
          <ProgressBar value={unitDone / unit.nodes.length} tone="gold" />
          <span className="num">{unitDone}/{unit.nodes.length}</span>
        </div>
        <Button block tone={unit.tone === 'gold' ? 'primary' : 'gold'} onClick={cta}>
          {finished ? t.backToRoad : node.kind === 'lesson' ? t.continueJourney : t.openReward}
        </Button>
      </motion.section>

      <section className="rcard">
        <div className="rcard__head">
          <h2 className="rcard__title">{t.level(level)}</h2>
          <span className="rcard__aside"><span className="num">{progress.xp}</span> {t.points}</span>
        </div>
        <ProgressBar value={into / span} tone="gold" />
        <p className="rcard__note">
          {t.toNextLevel.before}<span className="num">{span - into}</span>{t.toNextLevel.after}
        </p>
      </section>

      <section className="rcard">
        <div className="rcard__head">
          <h2 className="rcard__title">{t.wins}</h2>
          <button className="rcard__link" onClick={() => onTab('wins')}>{t.seeAll}</button>
        </div>
        <div className="rbadges">
          {ACHIEVEMENTS.map((a) => (
            <span key={a.id} className={`rbadge${won.includes(a.id) ? ' is-won' : ''}`} title={achievementText(a, lang).title}>
              <Icon name={a.icon} size={20} />
            </span>
          ))}
        </div>
        <p className="rcard__note">
          <span className="num">{won.length}</span> {t.of} <span className="num">{ACHIEVEMENTS.length}</span>
        </p>
      </section>

      {tab !== 'ask' && (
        <section className="rcard rcard--ask">
          <img className="rcard--ask__pose" src={POSE_SRC.think} alt="" width={84} height={98} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="rcard__title">{t.haveQuestion}</h2>
            <p className="rcard__note" style={{ marginBottom: 10 }}>{t.askPitch}</p>
            <Button size="sm" tone="ghost" onClick={() => onTab('ask')}>{t.askSiraj}</Button>
          </div>
        </section>
      )}

      <footer className="rail__foot">
        <Lantern size={16} />
        <span>{t.reviewedNote}</span>
      </footer>
    </aside>
  )
}
