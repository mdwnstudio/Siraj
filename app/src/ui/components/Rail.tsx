import { motion } from 'framer-motion'
import { useApp } from '../state'
import { UNIT_OF, PATH } from '../../core/content/path'
import { getLesson } from '../../core/content/lessons'
import { currentNodeId, isCompleted, isUnlocked } from '../../core/engine/pathView'
import { ACHIEVEMENTS, levelFromXp } from '../../core/engine/progress'
import { Icon, Lantern } from '../icons/SirajIcons'
import { Button } from './Button'
import { ProgressBar, StatRow, type Tab } from './Bars'
import { Siraj } from './Siraj'
import { POSE_SRC } from './SirajPose'
import { toAr } from '../screens/Home'

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
  const nodeId = currentNodeId(progress)
  const node = PATH.find((n) => n.id === nodeId)!
  const unit = UNIT_OF.get(nodeId)!
  const lesson = node.lessonId ? getLesson(node.lessonId) : undefined
  const unitDone = unit.nodes.filter((n) => isCompleted(progress, n.id)).length
  const finished = isCompleted(progress, nodeId)
  const { level, into, span } = levelFromXp(progress.xp)
  const won = progress.achievements

  const cta = () => {
    if (node.kind === 'lesson' && isUnlocked(progress, nodeId) && !finished) onStart(nodeId)
    else onTab('path')
  }

  return (
    <aside className="rail scroll" aria-label="لوحة التقدّم">
      <div className="rail__stats"><StatRow /></div>

      {/* where you are on the stair, and the one tap that continues it */}
      <motion.section className={`rcard rcard--next unitcard--${unit.tone}`}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="rcard__kicker">الوحدة {toAr(unit.index + 1)} · {unit.title}</div>
        <div className="rcard--next__row">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="rcard--next__title">
              {finished ? 'أتممتَ المتاح' : lesson?.title ?? 'مكافأة الطريق'}
            </div>
            <div className="rcard--next__meta">
              {finished
                ? 'الوحدات القادمة قريبًا'
                : lesson
                  ? `${toAr(lesson.cards.length)} بطاقات، ثم ${toAr(lesson.exercises.length)} تمارين`
                  : 'افتحها من الطريق'}
            </div>
          </div>
          <Siraj mood="wave" size={64} />
        </div>
        <div className="rcard--next__bar">
          <ProgressBar value={unitDone / unit.nodes.length} tone="gold" />
          <span className="num">{unitDone}/{unit.nodes.length}</span>
        </div>
        <Button block tone={unit.tone === 'gold' ? 'primary' : 'gold'} onClick={cta}>
          {finished ? 'عُد إلى الطريق' : node.kind === 'lesson' ? 'تابع الرحلة' : 'افتح المكافأة'}
        </Button>
      </motion.section>

      <section className="rcard">
        <div className="rcard__head">
          <h2 className="rcard__title">المستوى {toAr(level)}</h2>
          <span className="rcard__aside"><span className="num">{progress.xp}</span> نقطة</span>
        </div>
        <ProgressBar value={into / span} tone="gold" />
        <p className="rcard__note">
          باقي <span className="num">{span - into}</span> نقطة للمستوى التالي
        </p>
      </section>

      <section className="rcard">
        <div className="rcard__head">
          <h2 className="rcard__title">الإنجازات</h2>
          <button className="rcard__link" onClick={() => onTab('wins')}>عرض الكل</button>
        </div>
        <div className="rbadges">
          {ACHIEVEMENTS.map((a) => (
            <span key={a.id} className={`rbadge${won.includes(a.id) ? ' is-won' : ''}`} title={a.title}>
              <Icon name={a.icon} size={20} />
            </span>
          ))}
        </div>
        <p className="rcard__note">
          <span className="num">{won.length}</span> من <span className="num">{ACHIEVEMENTS.length}</span>
        </p>
      </section>

      {tab !== 'ask' && (
        <section className="rcard rcard--ask">
          <img className="rcard--ask__pose" src={POSE_SRC.think} alt="" width={84} height={98} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="rcard__title">عندك سؤال؟</h2>
            <p className="rcard__note" style={{ marginBottom: 10 }}>سراج يجيبك عمّا تعلّمته، من مصادر موثوقة.</p>
            <Button size="sm" tone="ghost" onClick={() => onTab('ask')}>اسأل سراج</Button>
          </div>
        </section>
      )}

      <footer className="rail__foot">
        <Lantern size={16} />
        <span>المحتوى منقول عن مصادر موثوقة، ويُراجَع من أهل العلم قبل النشر.</span>
      </footer>
    </aside>
  )
}
