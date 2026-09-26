import type { Lang, Progress, NodeResult } from '../types'
import { PATH, NODE_INDEX } from '../content/path'
import { DEFAULT_BANNER } from '../content/avatars'

/** every right answer in a lesson earns this, on top of the lesson's own xp */
export const XP_PER_CORRECT = 2

export function defaultProgress(): Progress {
  return {
    version: 1,
    onboarded: false,
    name: null,
    gender: null,
    avatar: null,
    banner: DEFAULT_BANNER,
    language: 'ar',
    xp: 0,
    streak: 0,
    lastActiveDay: null,
    completed: {},
    achievements: [],
    // Light by default. Dark is still available in Settings, and 'auto'
    // follows the OS, but neither is what a first-time visitor gets.
    settings: { sound: true, haptics: true, reduceMotion: false, theme: 'light' },
  }
}

/* ---------------- days & streak ---------------- */

export function dayKey(d: Date = new Date()): string {
  // local calendar day, not UTC - a streak should follow the learner's day
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const t1 = Date.UTC(ay, am - 1, ad)
  const t2 = Date.UTC(by, bm - 1, bd)
  return Math.round((t2 - t1) / 86400000)
}

/** streak as it stands *today*, without mutating anything */
export function currentStreak(p: Progress): number {
  if (!p.lastActiveDay) return 0
  const gap = daysBetween(p.lastActiveDay, dayKey())
  if (gap === 0 || gap === 1) return p.streak
  return 0
}

/* ---------------- unlocking ---------------- */

export function isCompleted(p: Progress, nodeId: string): boolean {
  return !!p.completed[nodeId]
}

/** a step opens once the step below it is done. the first step is always open. */
export function isUnlocked(p: Progress, nodeId: string): boolean {
  const i = NODE_INDEX.get(nodeId)
  if (i === undefined) return false
  const node = PATH[i]
  if (node.soon) return false
  if (i === 0) return true
  const prev = PATH[i - 1]
  return isCompleted(p, prev.id)
}

/** the step the learner is standing on - the lowest open, unfinished one */
export function currentNodeId(p: Progress): string {
  for (const n of PATH) {
    if (n.soon) break
    if (!isCompleted(p, n.id)) return n.id
  }
  for (let i = PATH.length - 1; i >= 0; i--) {
    if (!PATH[i].soon) return PATH[i].id
  }
  return PATH[0].id
}

export function completedCount(p: Progress): number {
  return Object.keys(p.completed).length
}

export function totalPlayable(): number {
  return PATH.filter((n) => !n.soon).length
}

/** Claim a path reward exactly once. Keeping this in core makes rapid taps,
 *  stale UI renders and future native clients unable to mint XP twice. */
export function claimReward(p: Progress, nodeId: string): Progress {
  const node = PATH.find((n) => n.id === nodeId)
  if (!node || node.kind === 'lesson' || node.soon) return p
  if (isCompleted(p, nodeId) || !isUnlocked(p, nodeId)) return p

  return {
    ...p,
    xp: p.xp + (node.kind === 'trophy' ? 60 : 30),
    completed: {
      ...p.completed,
      [nodeId]: { stars: 3, bestAccuracy: 1, at: Date.now() },
    },
  }
}

/* ---------------- levels ---------------- */

/** xp needed to reach level n (1-indexed). gently super-linear. */
export function xpForLevel(level: number): number {
  return Math.round(40 * level * (level - 1) * 0.5 + 30 * (level - 1))
}

export function levelFromXp(xp: number): { level: number; into: number; span: number } {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  const base = xpForLevel(level)
  const next = xpForLevel(level + 1)
  return { level, into: xp - base, span: Math.max(1, next - base) }
}

/* ---------------- achievements ---------------- */

export interface Achievement {
  id: string
  title: string
  note: string
  en: { title: string; note: string }
  icon: 'Sun' | 'Lantern' | 'Star' | 'Droplet' | 'Crescent' | 'Sparkle' | 'Flame'
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'أوّل خطوة', note: 'أتممتَ أوّل درس', icon: 'Sun',
    en: { title: 'First step', note: 'You finished your first lesson' } },
  { id: 'flawless', title: 'بلا خطأ', note: 'درسٌ كامل دون خطأ واحد', icon: 'Sparkle',
    en: { title: 'Flawless', note: 'A whole lesson without a single mistake' } },
  { id: 'streak-3', title: 'ثلاثة أيام', note: 'تعلّمتَ ثلاثة أيام متتالية', icon: 'Flame',
    en: { title: 'Three days', note: 'You learned three days in a row' } },
  { id: 'unit-intro', title: 'البداية', note: 'أتممتَ وحدة البداية', icon: 'Star',
    en: { title: 'The Beginning', note: 'You finished The Beginning' } },
  { id: 'unit-shahada', title: 'الشهادتان', note: 'أتممتَ وحدة الشهادتين', icon: 'Star',
    en: { title: 'The Shahadah', note: 'You finished the Shahadah unit' } },
  { id: 'unit-salah', title: 'إقام الصلاة', note: 'أتممتَ وحدة إقام الصلاة', icon: 'Lantern',
    en: { title: 'Establishing Prayer', note: 'You finished the prayer unit' } },
  { id: 'unit-zakah', title: 'الزكاة', note: 'أتممتَ وحدة الزكاة', icon: 'Droplet',
    en: { title: 'Zakah', note: 'You finished the Zakah unit' } },
  { id: 'unit-sawm', title: 'الصوم', note: 'أتممتَ وحدة الصوم', icon: 'Crescent',
    en: { title: 'Fasting', note: 'You finished the fasting unit' } },
  { id: 'unit-hajj', title: 'الحج', note: 'أتممتَ الأركان الخمسة كلّها', icon: 'Sparkle',
    en: { title: 'Hajj', note: 'You finished all five pillars' } },
  { id: 'curious', title: 'سائلٌ فَطِن', note: 'سألتَ سراجًا أوّل سؤال', icon: 'Crescent',
    en: { title: 'Curious mind', note: 'You asked Siraj your first question' } },
]

/** achievements that no longer exist, dropped from saved progress so the counts stay true */
export const RETIRED_ACHIEVEMENTS = ['full-lamp']

export function achievementText(a: Achievement, lang: Lang): { title: string; note: string } {
  return lang === 'en' ? a.en : { title: a.title, note: a.note }
}

export function achievementById(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

/* ---------------- applying a finished lesson ---------------- */

export interface LessonOutcome {
  nodeId: string
  xp: number
  total: number
  correct: number
  seconds: number
}

export interface ApplyResult {
  progress: Progress
  /** achievements earned by *this* lesson, for the celebration */
  newAchievements: string[]
  streakBumped: boolean
  leveledUp: boolean
}

export function applyLesson(p: Progress, o: LessonOutcome): ApplyResult {
  const today = dayKey()
  const beforeLevel = levelFromXp(p.xp).level

  // streak
  let streak = p.streak
  let streakBumped = false
  if (p.lastActiveDay !== today) {
    const gap = p.lastActiveDay ? daysBetween(p.lastActiveDay, today) : Infinity
    streak = gap === 1 ? p.streak + 1 : 1
    streakBumped = true
  }

  const accuracy = o.total ? o.correct / o.total : 0
  const stars = accuracy === 1 ? 3 : accuracy >= 0.8 ? 2 : 1
  const prev: NodeResult | undefined = p.completed[o.nodeId]

  const next: Progress = {
    ...p,
    xp: p.xp + o.xp,
    streak,
    lastActiveDay: today,
    completed: {
      ...p.completed,
      [o.nodeId]: {
        stars: Math.max(stars, prev?.stars ?? 0),
        bestAccuracy: Math.max(accuracy, prev?.bestAccuracy ?? 0),
        at: Date.now(),
      },
    },
  }

  // achievements
  const earned: string[] = []
  const add = (id: string) => {
    if (!next.achievements.includes(id) && !earned.includes(id)) earned.push(id)
  }
  if (Object.keys(next.completed).length === 1) add('first-step')
  if (accuracy === 1) add('flawless')
  if (streak >= 3) add('streak-3')

  for (const [unitId, achId] of [
    ['u-intro', 'unit-intro'],
    ['u-shahada', 'unit-shahada'],
    ['u-salah', 'unit-salah'],
    ['u-zakah', 'unit-zakah'],
    ['u-sawm', 'unit-sawm'],
    ['u-hajj', 'unit-hajj'],
  ] as const) {
    const nodes = PATH.filter((n) => n.unitId === unitId && !n.soon)
    if (nodes.length && nodes.every((n) => next.completed[n.id])) add(achId)
  }

  next.achievements = [...next.achievements, ...earned]

  return {
    progress: next,
    newAchievements: earned,
    streakBumped,
    leveledUp: levelFromXp(next.xp).level > beforeLevel,
  }
}

export function grantAchievement(p: Progress, id: string): Progress {
  if (p.achievements.includes(id)) return p
  return { ...p, achievements: [...p.achievements, id] }
}
