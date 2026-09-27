import { useState, type ReactNode } from 'react'
import { m as motion } from 'framer-motion'
import { useApp, useT } from '../state'
import { useLayout } from '../useLayout'
import { UNITS, unitText } from '../../core/content/path'
import { getLesson } from '../../core/content/lessons'
import { isCompleted, isUnlocked } from '../../core/engine/pathView'
import { GENERAL, chatAge, type ChatAge, type SavedChat, type SubjectId } from '../../core/ai/chats'
import type { Lang } from '../../core/types'
import { Icon, Sun } from '../icons/SirajIcons'
import { sfx, primeAudio } from '../../platform/sound'
import { haptic } from '../../platform/haptics'

/* The two sheets of the Ask tab: which subject to talk about, and the
   chats saved on this device. Bottom sheets on a phone, centred cards on
   a wider screen, the same as the profile editor. */

const tap = () => { primeAudio(); sfx.select(); haptic('tap') }

function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const phone = useLayout() === 'phone'
  const t = useT()
  const motionProps = phone
    ? { initial: { y: '100%' }, animate: { y: '0%' }, exit: { y: '100%' }, transition: { type: 'spring' as const, stiffness: 380, damping: 36 } }
    : { initial: { opacity: 0, scale: 0.92, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: 8 }, transition: { type: 'spring' as const, stiffness: 420, damping: 30 } }
  return (
    <>
      <motion.div className="scrim" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
      <motion.div className="sheet sheet--list" role="dialog" aria-label={label} {...motionProps}>
        <span className="sheet__grab" />
        <div className="sheet__head">
          <h2 className="sheet__title">{label}</h2>
          <button className="sheet__x" aria-label={t.close} onClick={onClose}><XGlyph /></button>
        </div>
        <div className="sheet__scroll">{children}</div>
      </motion.div>
    </>
  )
}

/** the subject's name and icon, for the chip and the history rows */
export function subjectLabel(subject: SubjectId, lang: Lang, general: string): { title: string; icon: ReactNode } {
  const l = subject === GENERAL ? undefined : getLesson(subject, lang)
  return l
    ? { title: l.title, icon: <Icon name={l.icon} size={19} /> }
    : { title: general, icon: <Sun size={19} /> }
}

/* ---------------- the subject chooser ----------------
   Like picking a study set before a tutor chat: the whole journey first,
   then every unit with its lessons, in the order of the stair. Lessons
   not reached yet are shown, so the road ahead is visible, but cannot be
   picked; the whole-journey chat covers a question about them. */

export function TopicSheet({ current, onPick, onClose }: {
  current: SubjectId
  onPick: (s: SubjectId) => void
  onClose: () => void
}) {
  const { progress } = useApp()
  const t = useT()
  const lang = progress.language
  const pick = (s: SubjectId) => { tap(); onPick(s) }
  // the step the learner stands on: the lowest lesson not yet finished
  const here = UNITS.flatMap((u) => u.nodes).find((n) => n.lessonId && !n.soon && !isCompleted(progress, n.id))?.id

  return (
    <Sheet label={t.chooseTopic} onClose={onClose}>
      <p className="sheet__note">{t.topicNote}</p>
      <button className={`trow trow--general${current === GENERAL ? ' is-on' : ''}`} aria-pressed={current === GENERAL}
        onClick={() => pick(GENERAL)}>
        <span className="trow__ico"><Sun size={20} /></span>
        <span className="trow__main">
          <span className="trow__title">{t.topicGeneral}</span>
          <span className="trow__note">{t.topicGeneralNote}</span>
        </span>
      </button>

      {UNITS.map((u) => {
        const nodes = u.nodes.filter((n) => n.lessonId && !n.soon)
        if (!nodes.length) return null
        return (
          <section key={u.id} className="tgroup">
            <div className="section__label">{t.unitKicker(u.index + 1, unitText(u, lang).title)}</div>
            <div className="tgroup__rows">
              {nodes.map((n) => {
                const l = getLesson(n.lessonId!, lang)
                if (!l) return null
                const done = isCompleted(progress, n.id)
                const open = isUnlocked(progress, n.id)
                const on = current === l.id
                return (
                  <button key={n.id} className={`trow${on ? ' is-on' : ''}`} disabled={!open} aria-pressed={on}
                    onClick={() => pick(l.id)}>
                    <span className="trow__ico"><Icon name={l.icon} size={19} /></span>
                    <span className="trow__main">
                      <span className="trow__title">{l.title}</span>
                      {(done || !open || n.id === here) && (
                        <span className={`trow__note${done ? ' is-done' : open ? ' is-here' : ''}`}>
                          {done ? t.topicDone : open ? t.topicHere : t.topicLocked}
                        </span>
                      )}
                    </span>
                    {on && <Check />}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}
    </Sheet>
  )
}

/* ---------------- saved chats ----------------
   Newest activity first, in the buckets people know from chat apps
   (today, yesterday, this week, earlier). Delete asks once, in place. */

export function ChatsSheet({ chats, openId, onOpen, onDelete, onClose }: {
  chats: SavedChat[]
  openId: string | null
  onOpen: (c: SavedChat) => void
  onDelete: (c: SavedChat) => void
  onClose: () => void
}) {
  const { progress } = useApp()
  const t = useT()
  const lang = progress.language
  const [asking, setAsking] = useState<string | null>(null)
  const now = Date.now()
  const groups = (['today', 'yesterday', 'week', 'older'] as ChatAge[])
    .map((age) => ({ age, list: chats.filter((c) => chatAge(c.updated, now) === age) }))
    .filter((g) => g.list.length)

  return (
    <Sheet label={t.chats} onClose={onClose}>
      {!chats.length ? (
        <div className="sheet__empty">
          <p style={{ fontWeight: 800 }}>{t.chatsEmpty[0]}</p>
          <p>{t.chatsEmpty[1]}</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.age} className="tgroup">
            <div className="section__label">{t.ages[g.age]}</div>
            <div className="tgroup__rows">
              {g.list.map((c) => {
                const s = subjectLabel(c.subject, lang, t.topicGeneral)
                if (asking === c.id) {
                  return (
                    <div key={c.id} className="trow trow--confirm" role="group" aria-label={t.deleteSure}>
                      <span className="trow__main"><span className="trow__title">{t.deleteSure}</span></span>
                      <button className="tbtn tbtn--bad" onClick={() => { tap(); setAsking(null); onDelete(c) }}>{t.deleteYes}</button>
                      <button className="tbtn" onClick={() => { tap(); setAsking(null) }}>{t.deleteNo}</button>
                    </div>
                  )
                }
                return (
                  <div key={c.id} className={`trow trow--chat${c.id === openId ? ' is-on' : ''}`}>
                    <button className="trow__hit" onClick={() => { tap(); onOpen(c) }}>
                      <span className="trow__ico">{s.icon}</span>
                      <span className="trow__main">
                        <span className="trow__title trow__title--clip">{c.title}</span>
                        <span className="trow__note">{s.title} · <bdi>{when(c.updated, g.age, lang)}</bdi></span>
                      </span>
                    </button>
                    <button className="trow__del" aria-label={t.deleteChat} title={t.deleteChat}
                      onClick={() => { tap(); setAsking(c.id) }}>
                      <XGlyph size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}
      <p className="sheet__note sheet__note--end">{t.chatsLocal}</p>
    </Sheet>
  )
}

/** a time today, a weekday this week, a date before that. Western digits, like every stat. */
function when(at: number, age: ChatAge, lang: Lang): string {
  const loc = lang === 'en' ? 'en' : 'ar-u-nu-latn'
  const opts: Intl.DateTimeFormatOptions = age === 'today' || age === 'yesterday'
    ? { hour: 'numeric', minute: '2-digit' }
    : age === 'week' ? { weekday: 'long' } : { day: 'numeric', month: 'short' }
  try { return new Intl.DateTimeFormat(loc, opts).format(at) } catch { return '' }
}

/* Plain utility glyphs, outside the Siraj Seven like the close X and the
   back chevron: affordances, not brand marks. */

export function XGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden focusable="false">
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  )
}

function Check() {
  return (
    <svg className="trow__check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M4 12.5 L9.5 18 L20 6.5" />
    </svg>
  )
}

/** three stacked lines: the list of saved chats */
export function HistoryGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden focusable="false">
      <path d="M4 6.5 H20 M4 12 H20 M4 17.5 H14" />
    </svg>
  )
}

/** a plus: start a new chat */
export function PlusGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden focusable="false">
      <path d="M12 5 V19 M5 12 H19" />
    </svg>
  )
}

/** the chevron under the subject chip: it opens a list */
export function DownGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M6 9 L12 15 L18 9" />
    </svg>
  )
}
