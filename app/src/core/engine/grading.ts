import type { Exercise } from '../types'

export type Answer =
  | { kind: 'choice'; optionId: string }
  | { kind: 'boolean'; value: boolean }
  | { kind: 'order'; sequence: string[] }
  | { kind: 'match'; mistakes: number }
  | { kind: 'sort'; placements: Record<string, string> }

export function isCorrect(ex: Exercise, a: Answer | null): boolean {
  if (!a) return false
  switch (ex.kind) {
    case 'choice':
      return a.kind === 'choice' && a.optionId === ex.answerId
    case 'boolean':
      return a.kind === 'boolean' && a.value === ex.answer
    case 'order':
      return (
        a.kind === 'order' &&
        a.sequence.length === ex.answer.length &&
        a.sequence.every((id, i) => id === ex.answer[i])
      )
    case 'match':
      // matching is graded live; a clean run means no mis-taps
      return a.kind === 'match' && a.mistakes === 0
    case 'sort':
      return (
        a.kind === 'sort' &&
        ex.items.every((it) => a.placements[it.id] === it.bucket)
      )
  }
}

/** what to show the learner after they answer */
export function explanationFor(ex: Exercise): string | undefined {
  return 'explain' in ex ? ex.explain : undefined
}

/** the right answer, rendered as readable Arabic, for the "not quite" banner */
export function correctAnswerText(ex: Exercise): string {
  switch (ex.kind) {
    case 'choice':
      return ex.options.find((o) => o.id === ex.answerId)?.label ?? ''
    case 'boolean':
      return ex.answer ? 'صح' : 'خطأ'
    case 'order':
      return ex.answer
        .map((id) => ex.items.find((i) => i.id === id)?.label ?? '')
        .join(' ← ')
    case 'match':
      return ex.pairs.map((p) => `${p.left}: ${p.right}`).join('، ')
    case 'sort':
      return ex.buckets
        .map(
          (b) =>
            `${b.label}: ${ex.items.filter((i) => i.bucket === b.id).map((i) => i.label).join('، ')}`,
        )
        .join(' • ')
  }
}

/** deterministic-enough shuffle; seeded so a retry isn't a fresh puzzle */
export function shuffle<T>(arr: T[], seed = 1): T[] {
  const a = [...arr]
  let s = seed || 1
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
