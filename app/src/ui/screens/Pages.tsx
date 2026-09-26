import { useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { useApp, useSetLanguage, useT } from '../state'
import type { Settings } from '../../core/types'
import {
  ACHIEVEMENTS, achievementText, completedCount, currentStreak,
  levelFromXp, totalPlayable,
} from '../../core/engine/progress'
import { PATH, UNIT_OF, unitText } from '../../core/content/path'
import { getLesson } from '../../core/content/lessons'
import { isLang } from '../../core/i18n'
import { LANGS } from '../languages'
import { Icon, Star, Flame, Sparkle, Sun, Crescent, Lantern } from '../icons/SirajIcons'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/Bars'
import { Siraj } from '../components/Siraj'
import { Avatar, Pencil, ProfileBanner, ProfileSheet } from '../components/Profile'
import { AskSiraj } from './AskSiraj'
import { POSE_SRC } from '../components/SirajPose'
import { webStore } from '../../platform/webStorage'
import { sfx, primeAudio } from '../../platform/sound'

/* ---------------- الإنجازات ---------------- */

export function WinsPage() {
  const { progress } = useApp()
  const t = useT()
  const won = progress.achievements
  return (
    <div className="page">
      <h1 className="page__title">{t.wins}</h1>
      <div className="phero phero--gold">
        <img className="phero__pose" src={POSE_SRC.celebrate} alt="" width={96} height={112} />
        <div className="phero__main">
          <div className="phero__title">{t.winsHero(won.length, ACHIEVEMENTS.length)}</div>
          <p className="phero__text">{t.winsText}</p>
          <ProgressBar value={won.length / ACHIEVEMENTS.length} tone="gold" />
        </div>
      </div>
      <div className="badges">
        {ACHIEVEMENTS.map((a, i) => {
          const has = won.includes(a.id)
          const text = achievementText(a, progress.language)
          return (
            <motion.div key={a.id} className={`badge${has ? ' is-won' : ''}`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.34, ease: [0.34, 1.56, 0.64, 1] }}>
              <span className="badge__ring"><Icon name={a.icon} size={24} /></span>
              <span className="badge__t">{text.title}</span>
              <span className="badge__n">{has ? text.note : '-'}</span>
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
  const t = useT()
  const lang = progress.language
  const done = PATH.filter((n) => n.kind === 'lesson' && progress.completed[n.id] && n.lessonId)
  // fewest stars first; ties go to the one learned earliest
  const weakest = done.reduce((a, n) => (progress.completed[n.id].stars < progress.completed[a.id].stars ? n : a), done[0])

  return (
    <div className="page">
      <h1 className="page__title">{t.review}</h1>
      {done.length === 0 ? (
        <div className="empty">
          <Siraj mood="think" size={130} />
          <p style={{ fontWeight: 700, lineHeight: 1.7 }}>
            {t.nothingYet[0]}<br />{t.nothingYet[1]}
          </p>
        </div>
      ) : (
        <>
          <div className="phero phero--info">
            <img className="phero__pose" src={POSE_SRC.think} alt="" width={96} height={112} />
            <div className="phero__main">
              <div className="phero__title">{t.reviewHero}</div>
              <p className="phero__text">
                {t.reviewLine(done.length, getLesson(weakest.lessonId!, lang)!.title)}
              </p>
              <Button size="md" tone="primary" onClick={() => onStart(weakest.id)}>{t.reviewWeakest}</Button>
            </div>
          </div>
          <div className="section__label">{t.allLearned}</div>
          <div className="rows review-grid">
            {done.map((n) => {
              const l = getLesson(n.lessonId!, lang)!
              const r = progress.completed[n.id]
              return (
                <button key={n.id} className="srow" onClick={() => { primeAudio(); sfx.tap(); onStart(n.id) }}>
                  <span className="klist__ico"><Icon name={l.icon} size={19} /></span>
                  <span className="srow__label" style={{ textAlign: 'start' }}>
                    {l.title}
                    <span className="srow__note" style={{ display: 'block' }}>{unitText(UNIT_OF.get(n.id)!, lang).title}</span>
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
  const lang = progress.language
  const firstOpen = PATH.find((n) => n.lessonId && !progress.completed[n.id]) ?? PATH[0]
  const lesson = getLesson(firstOpen.lessonId ?? 'l-intro-1', lang)!
  const unit = UNIT_OF.get(firstOpen.id)
  return (
    <div className="page page--ask" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="ask" style={{ position: 'relative', inset: 'auto', flex: 1, padding: 0 }}>
        {/* keyed by language: a switch starts a fresh chat in the new language */}
        <AskSiraj key={lang} lesson={lesson} unitTitle={unit ? unitText(unit, lang).title : ''} />
      </div>
    </div>
  )
}

/* ---------------- ملفي ---------------- */

export function MePage() {
  const { progress, dispatch } = useApp()
  const { level, into, span } = levelFromXp(progress.xp)
  const [confirm, setConfirm] = useState(false)
  const [editing, setEditing] = useState(false)
  const t = useT()
  const setLanguage = useSetLanguage()

  const set = (patch: Partial<Settings>) => dispatch({ type: 'settings', patch })

  return (
    <>
    <div className="page">
      {/* the profile: a cover across the top, the picture overlapping its
          lower edge, and a pencil beside it that opens the edit sheet */}
      <section className="profile">
        <div className="profile__cover"><ProfileBanner id={progress.banner} /></div>
        <div className="profile__row">
          <div className="profile__who">
            <h1 className="profile__name">{progress.name?.trim() || t.friend}</h1>
            <div className="profile__lvl">{t.level(level)}</div>
            <div style={{ marginTop: 8 }}><ProgressBar value={into / span} tone="gold" /></div>
          </div>
          <div className="profile__pic">
            <Avatar id={progress.avatar} name={progress.name} size={104} className="profile__avatar" />
            <button className="profile__edit" aria-label={t.editProfile}
              onClick={() => { primeAudio(); sfx.tap(); setEditing(true) }}>
              <Pencil size={18} />
            </button>
          </div>
        </div>
      </section>

      <div className="me-grid">
      <div>
      <div className="section" style={{ marginTop: 18 }}>
        <div className="section__label">{t.journey}</div>
        <div className="gridstats">
          <G icon={<Flame size={20} />} bg="var(--orange-soft)" fg="var(--orange)" v={currentStreak(progress)} k={t.statStreak(currentStreak(progress))} />
          <G icon={<Star size={20} />} bg="var(--yellow-soft)" fg="var(--yellow-deep)" v={progress.xp} k={t.statXpKey} />
          <G icon={<Sun size={20} />} bg="var(--good-soft)" fg="var(--good-deep)" v={completedCount(progress)} k={t.statSteps(totalPlayable())} />
          <G icon={<Sparkle size={20} />} bg="var(--info-soft)" fg="var(--info-deep)" v={progress.achievements.length} k={t.statWins} />
        </div>
      </div>

      <div className="section">
        <div className="section__label">{t.about}</div>
        <div className="card" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Lantern size={30} style={{ color: 'var(--orange)', flex: '0 0 auto' }} />
          <p style={{ fontSize: '.86rem', color: 'var(--ink-2)', fontWeight: 650, lineHeight: 1.7 }}>
            {t.aboutText}
            <span style={{ display: 'block', marginTop: 4, fontSize: '.72rem', color: 'var(--ink-3)' }}>
              {t.version} <span className="num">{__BUILD__}</span>
            </span>
          </p>
        </div>
      </div>

      </div>

      <div className="me-grid__col2">
      <div className="section">
        <div className="section__label">{t.settings}</div>
        <div className="rows">
          <Row label={t.sound} note={t.soundNote}>
            <Toggle on={progress.settings.sound} onTap={() => set({ sound: !progress.settings.sound })} />
          </Row>
          <Row label={t.haptics} note={t.hapticsNote}>
            <Toggle on={progress.settings.haptics} onTap={() => set({ haptics: !progress.settings.haptics })} />
          </Row>
          <Row label={t.calm} note={t.calmNote}>
            <Toggle on={progress.settings.reduceMotion} onTap={() => set({ reduceMotion: !progress.settings.reduceMotion })} />
          </Row>
        </div>
      </div>

      <div className="section">
        <div className="section__label">{t.look}</div>
        <div className="seg">
          {(['auto', 'light', 'dark'] as const).map((v) => (
            <button key={v} className={`seg__b${progress.settings.theme === v ? ' is-on' : ''}`}
              onClick={() => { primeAudio(); sfx.tap(); set({ theme: v }) }}>
              {t.themes[v]}
            </button>
          ))}
        </div>
      </div>

      {/* the same choice as the flag in the top bar; progress is kept either way */}
      <div className="section">
        <div className="section__label">{t.language}</div>
        <div className="seg">
          {LANGS.filter((l) => l.ready).map((l) => (
            <button key={l.id} className={`seg__b${progress.language === l.id ? ' is-on' : ''}`}
              aria-pressed={progress.language === l.id}
              onClick={() => { primeAudio(); sfx.tap(); if (isLang(l.id)) void setLanguage(l.id) }}>
              <span lang={l.id}>{l.label}</span>
              {'beta' in l && l.beta && <span className="lang__beta">{t.beta}</span>}
            </button>
          ))}
        </div>
        <p className="section__note">{progress.language === 'en' ? t.languageBeta : t.languageNote}</p>
      </div>

      <div className="section">
        {confirm ? (
          <div className="card" style={{ display: 'grid', gap: 10, borderColor: 'var(--bad)' }}>
            <p style={{ fontWeight: 750, color: 'var(--bad-deep)' }}>
              {t.resetWarn}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button tone="danger" size="md" block onClick={() => { webStore.clear(); location.reload() }}>
                {t.resetYes}
              </Button>
              <Button tone="quiet" size="md" block onClick={() => setConfirm(false)}>{t.resetNo}</Button>
            </div>
          </div>
        ) : (
          <Button tone="quiet" size="md" block onClick={() => setConfirm(true)}>{t.reset}</Button>
        )}
      </div>
      </div>
      </div>
      <div style={{ height: 10 }} />
    </div>
    <AnimatePresence>
      {editing && (
        <ProfileSheet name={progress.name} gender={progress.gender} avatar={progress.avatar} banner={progress.banner}
          onChange={(patch) => dispatch({ type: 'profile', patch })}
          onClose={() => setEditing(false)} />
      )}
    </AnimatePresence>
    </>
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
