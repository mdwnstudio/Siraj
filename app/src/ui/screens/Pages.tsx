import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, m as motion } from 'framer-motion'
import { useApp, useLang, useSetLanguage, useT } from '../state'
import type { Settings } from '../../core/types'
import {
  ACHIEVEMENTS, achievementText, completedCount, currentStreak,
  levelFromXp, totalPlayable,
} from '../../core/engine/progress'
import { PATH, unitById, unitText } from '../../core/content/path'
import { PRACTICE_SIZE, mistakesByUnit, practiceSet, resolveMistakes } from '../../core/engine/mistakes'
import { correctAnswerText, exerciseQuestion } from '../../core/engine/grading'
import { GENERAL, type SavedChat, type SubjectId } from '../../core/ai/chats'
import { chatStore, useChats } from '../chats'
import { ChatsSheet, DownGlyph, HistoryGlyph, PlusGlyph, TopicSheet, subjectLabel } from '../components/AskSheets'
import type { PracticeItem } from './Lesson'
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

/* ---------------- أخطائي ----------------
   Every question answered wrong, kept until it is answered right. The
   pattern is Duolingo's Mistakes review: one button runs a short session
   drawn from the list, and each right answer takes a question off it.
   Below, the list itself, grouped by unit the way the stair is, so the
   learner can look at the right answer or ask Siraj about a question. */

export function MistakesPage({ onPractice, onAsk }: {
  onPractice: (items: PracticeItem[]) => void
  onAsk: (subject: SubjectId, draft: string) => void
}) {
  const { progress } = useApp()
  const t = useT()
  const lang = progress.language
  const items = resolveMistakes(progress, lang)
  const learned = PATH.some((n) => n.kind === 'lesson' && progress.completed[n.id])
  const [open, setOpen] = useState<string | null>(null)

  const start = () => {
    primeAudio(); sfx.tap()
    onPractice(practiceSet(items).map(({ mistake: m }) => ({ lessonId: m.lessonId, exerciseId: m.exerciseId, nodeId: m.nodeId })))
  }

  return (
    <div className="page">
      <h1 className="page__title">{t.mistakes}</h1>
      {!items.length ? (
        <div className="empty">
          <Siraj mood={learned ? 'cheer' : 'think'} size={130} />
          <p style={{ fontWeight: 700, lineHeight: 1.7 }}>
            {(learned ? t.mistakesClear : t.mistakesNone)[0]}<br />
            <span style={{ fontWeight: 600, color: 'var(--ink-3)' }}>{(learned ? t.mistakesClear : t.mistakesNone)[1]}</span>
          </p>
        </div>
      ) : (
        <>
          <div className="phero phero--info">
            <img className="phero__pose" src={POSE_SRC.think} alt="" width={96} height={112} />
            <div className="phero__main">
              <div className="phero__title">{t.mistakesHero(items.length)}</div>
              <p className="phero__text">
                {t.mistakesText}
                {items.length > PRACTICE_SIZE && <> {t.mistakesSession(PRACTICE_SIZE)}</>}
              </p>
              <Button size="md" tone="primary" onClick={start}>{t.mistakesStart}</Button>
            </div>
          </div>

          {mistakesByUnit(items).map((g) => {
            const unit = unitById(g.unitId)
            return (
              <section key={g.unitId} className="section">
                {unit && <div className="section__label">{t.unitKicker(unit.index + 1, unitText(unit, lang).title)}</div>}
                <div className="mlist">
                  {g.items.map(({ mistake: m, exercise: ex, lessonTitle }) => {
                    const k = `${m.lessonId}:${m.exerciseId}`
                    const shown = open === k
                    const q = exerciseQuestion(ex)
                    return (
                      <motion.article key={k} className="mcard"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
                        <div className="mcard__top">
                          <span className="mcard__from">{lessonTitle}</span>
                          {m.misses > 1 && (
                            <span className="mcard__misses" title={t.missedTimes} aria-label={`${t.missedTimes}: ${m.misses}`}>
                              <span className="num">×{m.misses}</span>
                            </span>
                          )}
                        </div>
                        <p className="mcard__q">{q}</p>
                        <AnimatePresence initial={false}>
                          {shown && (
                            <motion.div className="mcard__a"
                              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}>
                              <b>{t.correctIs}</b>{correctAnswerText(ex, lang)}
                              {'explain' in ex && ex.explain && <span className="mcard__why">{ex.explain}</span>}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <div className="mcard__actions">
                          <button className="mcard__btn" aria-expanded={shown}
                            onClick={() => { primeAudio(); sfx.tap(); setOpen(shown ? null : k) }}>
                            {shown ? t.hideAnswer : t.showAnswer}
                          </button>
                          <button className="mcard__btn mcard__btn--ask"
                            onClick={() => { primeAudio(); sfx.tap(); onAsk(m.lessonId, t.askAboutDraft(q).slice(0, 400)) }}>
                            <Lantern size={16} /> {t.askAboutIt}
                          </button>
                        </div>
                      </motion.article>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}

/* ---------------- اسأل سراج (tab) ----------------
   A chat with a subject. The chip at the top says what the chat is about
   and opens the chooser; the lines on the right open the saved chats; the
   plus on the left starts a new one. Each chat saves itself as it goes. */

export function AskPage({ seed, onSeed }: {
  /** open a new chat on this subject with this question typed in (from أخطائي) */
  seed?: { subject: SubjectId; draft: string } | null
  onSeed?: () => void
}) {
  const lang = useLang()
  // a language switch starts over in the new language
  return <AskTab key={lang} seed={seed} onSeed={onSeed} />
}

function AskTab({ seed, onSeed }: { seed?: { subject: SubjectId; draft: string } | null; onSeed?: () => void }) {
  const { progress } = useApp()
  const t = useT()
  const lang = progress.language
  const chats = useChats().filter((c) => c.lang === lang)
  // where the learner stands: the lowest lesson not yet done, or the whole course
  const here = PATH.find((n) => n.lessonId && !n.soon && !progress.completed[n.id])?.lessonId ?? GENERAL

  const [view, setView] = useState<{ subject: SubjectId; chatId: string | null; draft?: string; n: number }>(() => {
    if (seed) return { subject: seed.subject, chatId: null, draft: seed.draft, n: 0 }
    const last = chatStore.open()
    const c = last ? chatStore.get(last) : undefined
    if (c && c.lang === lang) return { subject: c.subject, chatId: c.id, n: 0 }
    return { subject: here, chatId: null, n: 0 }
  })
  const [sheet, setSheet] = useState<null | 'topic' | 'chats'>(null)
  useEffect(() => { if (seed) { chatStore.setOpen(null); onSeed?.() } }, [])

  const chat = view.chatId ? chats.find((c) => c.id === view.chatId) : undefined
  const label = subjectLabel(view.subject, lang, t.topicGeneral)

  const fresh = (subject: SubjectId) => {
    chatStore.setOpen(null)
    setView((v) => ({ subject, chatId: null, n: v.n + 1 }))
  }
  const pickTopic = (s: SubjectId) => {
    setSheet(null)
    // an empty chat just changes its subject; one with messages is kept and a new one begins
    if (s !== view.subject || view.chatId) fresh(s)
  }
  const openChat = (c: SavedChat) => {
    setSheet(null)
    chatStore.setOpen(c.id)
    setView((v) => ({ subject: c.subject, chatId: c.id, n: v.n + 1 }))
  }
  const deleteChat = (c: SavedChat) => {
    chatStore.remove(c.id)
    if (c.id === view.chatId) fresh(view.subject)
  }
  const onSaved = useCallback((id: string) => {
    chatStore.setOpen(id)
    setView((v) => (v.chatId === id ? v : { ...v, chatId: id }))
  }, [])

  return (
    <div className="page page--ask" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="askbar">
        <button className="askbar__btn" aria-label={t.chats} title={t.chats}
          onClick={() => { primeAudio(); sfx.tap(); setSheet('chats') }}>
          <HistoryGlyph />
          {!!chats.length && <span className="askbar__dot" aria-hidden />}
        </button>
        <button className="askbar__topic" aria-label={t.topicAria(label.title)} aria-haspopup="dialog"
          onClick={() => { primeAudio(); sfx.tap(); setSheet('topic') }}>
          <span className="askbar__ico">{label.icon}</span>
          <span className="askbar__title">{label.title}</span>
          <DownGlyph />
        </button>
        <button className="askbar__btn" aria-label={t.newChat} title={t.newChat} disabled={!view.chatId}
          onClick={() => { primeAudio(); sfx.tap(); fresh(view.subject) }}>
          <PlusGlyph />
        </button>
      </div>
      <div className="ask" style={{ position: 'relative', inset: 'auto', flex: 1, padding: 0 }}>
        <AskSiraj key={view.n} subject={view.subject} chat={chat} draft={view.draft} onSaved={onSaved} />
      </div>

      <AnimatePresence>
        {sheet === 'topic' && <TopicSheet current={view.subject} onPick={pickTopic} onClose={() => setSheet(null)} />}
        {sheet === 'chats' && (
          <ChatsSheet chats={chats} openId={view.chatId} onOpen={openChat} onDelete={deleteChat} onClose={() => setSheet(null)} />
        )}
      </AnimatePresence>
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
          <G icon={<Sun size={20} />} bg="var(--good-soft)" fg="var(--good-ink)" v={completedCount(progress)} k={t.statSteps(totalPlayable())} />
          <G icon={<Sparkle size={20} />} bg="var(--info-soft)" fg="var(--info-ink)" v={progress.achievements.length} k={t.statWins} />
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
            <p style={{ fontWeight: 750, color: 'var(--bad-ink)' }}>
              {t.resetWarn}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button tone="danger" size="md" block onClick={() => { webStore.clear(); chatStore.clear(); location.reload() }}>
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
