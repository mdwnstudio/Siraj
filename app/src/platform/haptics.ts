type Pattern = 'tap' | 'correct' | 'wrong' | 'win' | 'unlock'

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  correct: [0, 14, 40, 22],
  wrong: [0, 32, 60, 32],
  win: [0, 18, 50, 18, 50, 45],
  unlock: [0, 12, 30, 12, 30, 12, 60, 60],
}

let enabled = true
export function setHaptics(on: boolean) {
  enabled = on
}

export function haptic(p: Pattern) {
  if (!enabled) return
  try {
    navigator.vibrate?.(PATTERNS[p])
  } catch {
    /* unsupported - silently fine */
  }
}
