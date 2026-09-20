import type { Progress, NodeResult } from '../types'
import { PATH, NODE_INDEX } from '../content/path'

export const MAX_OIL = 5
/** one drop back every 20 minutes */
const OIL_REGEN_MS = 20 * 60 * 1000

export function defaultProgress(): Progress {
  return {
    version: 1,
    onboarded: false,
    name: null,
    language: 'ar',
    xp: 0,
    streak: 0,
    lastActiveDay: null,
    oil: MAX_OIL,
    oilUpdatedAt: Date.now(),
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

/* ---------------- oil (lives) ---------------- */

export function currentOil(p: Progress): number {
  if (p.oil >= MAX_OIL) return MAX_OIL
  const regained = Math.floor((Date.now() - p.oilUpdatedAt) / OIL_REGEN_MS)
  return Math.min(MAX_OIL, p.oil + regained)
}

export function msToNextOil(p: Progress): number {
  if (currentOil(p) >= MAX_OIL) return 0
  const elapsed = (Date.now() - p.oilUpdatedAt) % OIL_REGEN_MS
  return OIL_REGEN_MS - elapsed
}

export function spendOil(p: Progress, n = 1): Progress {
  const now = currentOil(p)
  return { ...p, oil: Math.max(0, now - n), oilUpdatedAt: Date.now() }
}

export function refillOil(p: Progress): Progress {
  return { ...p, oil: MAX_OIL, oilUpdatedAt: Date.now() }
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
  return PATH[PATH.length - 1].id
}

export function completedCount(p: Progress): number {
  return Object.keys(p.completed).length
}

export function totalPlayable(): number {
  return PATH.filter((n) => !n.soon).length
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
  icon: 'Sun' | 'Lantern' | 'Star' | 'Droplet' | 'Crescent' | 'Sparkle' | 'Flame'
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'أوّل خطوة', note: 'أتممتَ أوّل درس', icon: 'Sun' },
  { id: 'flawless', title: 'بلا خطأ', note: 'درسٌ كامل دون خطأ واحد', icon: 'Sparkle' },
  { id: 'full-lamp', title: 'مصباحٌ ممتلئ', note: 'أنهيتَ درسًا دون أن تفقد قطرة', icon: 'Droplet' },
  { id: 'streak-3', title: 'ثلاثة أيام', note: 'تعلّمتَ ثلاثة أيام متتالية', icon: 'Flame' },
  { id: 'unit-intro', title: 'البداية', note: 'أتممتَ وحدة البداية', icon: 'Star' },
  { id: 'unit-shahada', title: 'الشهادة', note: 'أتممتَ وحدة الشهادة', icon: 'Star' },
  { id: 'unit-salah', title: 'الصلاة', note: 'أتممتَ وحدة الصلاة', icon: 'Lantern' },
  { id: 'curious', title: 'سائلٌ فَطِن', note: 'سألتَ سراجًا أوّل سؤال', icon: 'Crescent' },
]

export function achievementById(id: string) {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

/* ---------------- applying a finished lesson ---------------- */

export interface LessonOutcome {
  nodeId: string
  xp: number
  total: number
  correct: number
  oilLost: number
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
  if (o.oilLost === 0) add('full-lamp')
  if (streak >= 3) add('streak-3')

  for (const [unitId, achId] of [
    ['u-intro', 'unit-intro'],
    ['u-shahada', 'unit-shahada'],
    ['u-salah', 'unit-salah'],
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
