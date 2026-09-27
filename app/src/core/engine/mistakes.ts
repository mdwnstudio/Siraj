/* ============================================================
   أخطائي: every question the learner got wrong, kept until they
   get it right. Pure functions, no DOM.

   The idea is Duolingo's Mistakes review: a wrong answer is logged
   the moment it happens, and a short session drawn from the log
   lets the learner put it right. Answering it right, in that
   session or on a replay of the lesson, takes it off the list.
   ============================================================ */

import type { Exercise, Lang, Mistake, Progress } from '../types'
import { getLesson } from '../content/lessons'
import { PATH, UNIT_OF } from '../content/path'
import { XP_PER_CORRECT } from './progress'

/** the list is capped so an old save can never grow without bound */
export const MAX_MISTAKES = 60
/** questions in one practice session, as Duolingo does with up to ten */
export const PRACTICE_SIZE = 8
/** a finished practice session earns this on top of its right answers */
export const PRACTICE_XP = 5

const key = (lessonId: string, exerciseId: string) => `${lessonId}:${exerciseId}`

/** A wrong answer: log it, or bump it back to the top if it was already there. */
export function recordMistake(p: Progress, m: { lessonId: string; exerciseId: string; nodeId: string }): Progress {
  const k = key(m.lessonId, m.exerciseId)
  const old = p.mistakes.find((x) => key(x.lessonId, x.exerciseId) === k)
  const entry: Mistake = { ...m, at: Date.now(), misses: (old?.misses ?? 0) + 1 }
  const rest = p.mistakes.filter((x) => key(x.lessonId, x.exerciseId) !== k)
  return { ...p, mistakes: [entry, ...rest].slice(0, MAX_MISTAKES) }
}

/** A right answer: whatever was logged against this question is cleared. */
export function clearMistake(p: Progress, lessonId: string, exerciseId: string): Progress {
  const k = key(lessonId, exerciseId)
  if (!p.mistakes.some((x) => key(x.lessonId, x.exerciseId) === k)) return p
  return { ...p, mistakes: p.mistakes.filter((x) => key(x.lessonId, x.exerciseId) !== k) }
}

export function hasMistake(p: Progress, lessonId: string, exerciseId: string): boolean {
  const k = key(lessonId, exerciseId)
  return p.mistakes.some((x) => key(x.lessonId, x.exerciseId) === k)
}

/** A logged mistake with its question resolved in the learner's language.
 *  Mistakes whose question no longer exists (content was edited) drop out. */
export interface MistakeItem {
  mistake: Mistake
  exercise: Exercise
  lessonTitle: string
}

export function resolveMistakes(p: Progress, lang: Lang): MistakeItem[] {
  const out: MistakeItem[] = []
  for (const m of p.mistakes) {
    const lesson = getLesson(m.lessonId, lang)
    const exercise = lesson?.exercises.find((e) => e.id === m.exerciseId)
    if (lesson && exercise) out.push({ mistake: m, exercise, lessonTitle: lesson.title })
  }
  return out
}

/** Grouped the way the stair is: by unit, in the order they are climbed. */
export function mistakesByUnit(items: MistakeItem[]): { unitId: string; items: MistakeItem[] }[] {
  const order = new Map(PATH.map((n, i) => [n.id, i]))
  const groups = new Map<string, MistakeItem[]>()
  for (const it of items) {
    const unitId = UNIT_OF.get(it.mistake.nodeId)?.id ?? 'u-intro'
    groups.set(unitId, [...(groups.get(unitId) ?? []), it])
  }
  return [...groups.entries()]
    .map(([unitId, list]) => ({
      unitId,
      items: list.sort((a, b) => (order.get(a.mistake.nodeId) ?? 0) - (order.get(b.mistake.nodeId) ?? 0)),
    }))
    .sort((a, b) => (order.get(a.items[0].mistake.nodeId) ?? 0) - (order.get(b.items[0].mistake.nodeId) ?? 0))
}

/** The questions for one session: the ones missed most often first,
 *  then the most recent, so the stubborn ones come back soonest. */
export function practiceSet(items: MistakeItem[], size = PRACTICE_SIZE): MistakeItem[] {
  return [...items]
    .sort((a, b) => b.mistake.misses - a.mistake.misses || b.mistake.at - a.mistake.at)
    .slice(0, size)
}

export function practiceXp(correct: number): number {
  return correct * XP_PER_CORRECT + (correct > 0 ? PRACTICE_XP : 0)
}

/** only well-formed entries survive a load from storage */
export function reviveMistakes(raw: unknown): Mistake[] {
  if (!Array.isArray(raw)) return []
  const out: Mistake[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') continue
    const { lessonId, exerciseId, nodeId, at, misses } = m as Record<string, unknown>
    if (typeof lessonId !== 'string' || typeof exerciseId !== 'string' || typeof nodeId !== 'string') continue
    out.push({
      lessonId, exerciseId, nodeId,
      at: typeof at === 'number' ? at : 0,
      misses: typeof misses === 'number' && misses > 0 ? Math.round(misses) : 1,
    })
  }
  return out.slice(0, MAX_MISTAKES)
}
