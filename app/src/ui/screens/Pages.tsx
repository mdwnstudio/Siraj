import { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../state'
import type { Settings } from '../../core/types'
import {
  ACHIEVEMENTS, completedCount, currentStreak, currentOil,
  levelFromXp, totalPlayable, MAX_OIL, msToNextOil,
} from '../../core/engine/progress'
import { PATH, UNIT_OF } from '../../core/content/path'
import { getLesson } from '../../core/content/lessons'
import { Icon, Star, Flame, Droplet, Sparkle, Sun, Crescent, Lantern } from '../icons/SirajIcons'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/Bars'
import { Siraj } from '../components/Siraj'
import { AskSiraj } from './AskSiraj'
import { toAr } from './Home'
import { webStore } from '../../platform/webStorage'
import { sfx, primeAudio } from '../../platform/sound'

/* ---------------- الإنجازات ---------------- */

export function WinsPage() {
  const { progress } = useApp()
  const won = progress.achievements
  return (
    <div className="page">
      <h1 className="page__title">الإنجازات</h1>
      <p style={{ color: 'var(--ink-2)', fontWeight: 650, marginBottom: 18 }}>
        {toAr(won.length)} من {toAr(ACHIEVEMENTS.length)}
      </p>
      <div className="badges">
        {ACHIEVEMENTS.map((a, i) => {
          const has = won.includes(a.id)
          return (
            <motion.div key={a.id} className={`badge${has ? ' is-won' : ''}`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.34, ease: [0.34, 1.56, 0.64, 1] }}>
              <span className="badge__ring"><Icon name={a.icon} size={24} /></span>
              <span className="badge__t">{a.title}</span>
              <span className="badge__n">{has ? a.note : '-'}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- المراجعة ---------------- */

export function ReviewPage({ onStart }: { onStart: (nodeId: string) => void }) {
  const { progress } = useApp()
  const done = PATH.filter((n) => n.kind === 'lesson' && progress.completed[n.id] && n.lessonId)

  return (
    <div className="page">
      <h1 className="page__title">المراجعة</h1>
      {done.length === 0 ? (
        <div className="empty">
          <Siraj mood="think" size={130} />
          <p style={{ fontWeight: 700, lineHeight: 1.7 }}>
            لا شيء لمراجعته بعد.<br />أتمِم درسًا أوّلًا وسيظهر هنا.
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--ink-2)', fontWeight: 650, marginBottom: 16 }}>
            كرّر ما تعلّمته - التكرار هو ما يُثبّت المعلومة.
          </p>
          <div className="rows">
            {done.map((n) => {
              const l = getLesson(n.lessonId!)!
              const r = progress.completed[n.id]
              return (
                <button key={n.id} className="srow" onClick={() => { primeAudio(); sfx.tap(); onStart(n.id) }}>
                  <span className="klist__ico"><Icon name={l.icon} size={19} /></span>
                  <span className="srow__label" style={{ textAlign: 'start' }}>
                    {l.title}
                    <span className="srow__note" style={{ display: 'block' }}>{UNIT_OF.get(n.id)?.title}</span>
                  </span>
                  <span style={{ display: 'flex', gap: 2, color: 'var(--yellow)' }}>
                    {Array.from({ length: r.stars }, (_, k) => <Star key={k} size={13} />)}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/* ---------------- اسأل سراج (tab) ---------------- */

export function AskPage() {
  const { progress } = useApp()
  const firstOpen = PATH.find((n) => n.lessonId && !progress.completed[n.id]) ?? PATH[0]
  const lesson = getLesson(firstOpen.lessonId ?? 'l-intro-1')!
  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', padding: '0 var(--gutter)', overflow: 'hidden' }}>
      <div className="ask" style={{ position: 'relative', inset: 'auto', flex: 1, padding: 0 }}>
        <AskSiraj lesson={lesson} unitTitle={UNIT_OF.get(firstOpen.id)?.title ?? ''} onFinish={() => {}} />
      </div>
    </div>
  )
}

/* ---------------- ملفي ---------------- */

export function MePage() {
  const { progress, dispatch } = useApp()
  const { level, into, span } = levelFromXp(progress.xp)
  const [confirm, setConfirm] = useState(false)
  const oil = currentOil(progress)

  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings', patch })

  return (
    <div className="page">
      <div className="hero">
        <span className="hero__avatar">{progress.name?.trim()?.[0] ?? 'س'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hero__name">{progress.name?.trim() || 'صديق سراج'}</div>
          <div className="hero__lvl">المستوى {toAr(level)}</div>
          <div style={{ marginTop: 8 }}><ProgressBar value={into / span} tone="gold" /></div>
        </div>
      </div>

      <div className="section" style={{ marginTop: 18 }}>
        <div className="section__label">رحلتك</div>
        <div className="gridstats">
          <G icon={<Flame size={20} />} bg="var(--orange-soft)" fg="var(--orange)" v={currentStreak(progress)} k={currentStreak(progress) === 1 ? 'يوم متتالٍ' : 'أيام متتالية'} />
          <G icon={<Star size={20} />} bg="var(--yellow-soft)" fg="var(--yellow-deep)" v={progress.xp} k="نقطة خبرة" />
          <G icon={<Sun size={20} />} bg="var(--good-soft)" fg="var(--good-deep)" v={completedCount(progress)} k={`من ${toAr(totalPlayable())} درجة`} />
          <G icon={<Sparkle size={20} />} bg="var(--info-soft)" fg="var(--info-deep)" v={progress.achievements.length} k="إنجاز" />
        </div>
      </div>

      <div className="section">
        <div className="section__label">قطرات الزيت</div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ display: 'flex', gap: 3, color: 'var(--info)' }}>
            {Array.from({ length: MAX_OIL }, (_, i) => (
              <span key={i} style={{ opacity: i < oil ? 1 : 0.22 }}><Droplet size={22} /></span>
            ))}
          </span>
          <span style={{ fontSize: '.84rem', color: 'var(--ink-2)', fontWeight: 650, lineHeight: 1.5 }}>
            {oil >= MAX_OIL ? 'مصباحك ممتلئ.' : `قطرة جديدة بعد ${toAr(Math.ceil(msToNextOil(progress) / 60000))} دقيقة.`}
          </span>
        </div>
      </div>

      <div className="section">
        <div className="section__label">الإعدادات</div>
        <div className="rows">
          <Row label="الأصوات" note="نغمات قصيرة عند الإجابة">
            <Toggle on={progress.settings.sound} onTap={() => set({ sound: !progress.settings.sound })} />
          </Row>
          <Row label="الاهتزاز" note="على الأجهزة التي تدعمه">
            <Toggle on={progress.settings.haptics} onTap={() => set({ haptics: !progress.settings.haptics })} />
          </Row>
          <Row label="تقليل الحركة" note="إيقاف الاحتفالات المتحرّكة">
            <Toggle on={progress.settings.reduceMotion} onTap={() => set({ reduceMotion: !progress.settings.reduceMotion })} />
          </Row>
        </div>
      </div>

      <div className="section">
        <div className="section__label">المظهر</div>
        <div className="seg">
          {([['auto', 'تلقائي'], ['light', 'فاتح'], ['dark', 'داكن']] as const).map(([v, l]) => (
            <button key={v} className={`seg__b${progress.settings.theme === v ? ' is-on' : ''}`}
              onClick={() => { primeAudio(); sfx.tap(); set({ theme: v }) }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section__label">عن سراج</div>
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Lantern size={30} style={{ color: 'var(--orange)', flex: '0 0 auto' }} />
          <p style={{ fontSize: '.86rem', color: 'var(--ink-2)', fontWeight: 650, lineHeight: 1.7 }}>
            رحلة تفاعلية لتعلّم أساسيات الإسلام. المحتوى منقول عن مصادر موثوقة،
            ويُراجَع من أهل العلم قبل النشر.
          </p>
        </div>
      </div>

      <div className="section">
        {confirm ? (
          <div className="card" style={{ display: 'grid', gap: 10, borderColor: 'var(--bad)' }}>
            <p style={{ fontWeight: 750, color: 'var(--bad-deep)' }}>
              سيُحذف كل تقدّمك - النقاط والأيام المتتالية والدروج المفتوحة. لا يمكن التراجع.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button tone="danger" size="md" block onClick={() => { webStore.clear(); location.reload() }}>
                نعم، احذف
              </Button>
              <Button tone="quiet" size="md" block onClick={() => setConfirm(false)}>تراجع</Button>
            </div>
          </div>
        ) : (
          <Button tone="quiet" size="md" block onClick={() => setConfirm(true)}>إعادة ضبط التقدّم</Button>
        )}
      </div>
      <div style={{ height: 10 }} />
    </div>
  )
}

function G({ icon, bg, fg, v, k }: { icon: React.ReactNode; bg: string; fg: string; v: number; k: string }) {
  return (
    <div className="gstat">
      <span className="gstat__ico" style={{ background: bg, color: fg }}>{icon}</span>
      <div>
        <div className="gstat__v num">{v}</div>
        <div className="gstat__k">{k}</div>
      </div>
    </div>
  )
}

function Row({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="srow">
      <span className="srow__label">
        {label}
        {note && <span className="srow__note" style={{ display: 'block' }}>{note}</span>}
      </span>
      {children}
    </div>
  )
}

function Toggle({ on, onTap }: { on: boolean; onTap: () => void }) {
  return (
    <button className={`toggle${on ? ' is-on' : ''}`} role="switch" aria-checked={on}
      onClick={() => { primeAudio(); sfx.select(); onTap() }}>
      <span className="toggle__knob" />
    </button>
  )
}

export const PageIcons = { Sun, Crescent, Lantern, Star }
