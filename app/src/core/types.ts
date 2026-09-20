/* ============================================================
   CORE TYPES - zero DOM, zero React. This file and everything
   under core/ ports to React Native untouched.
   ============================================================ */

import type { SirajIconName } from '../ui/icons/SirajIcons'
export type { SirajIconName }

/* ---------------- teaching phase: بطاقات المعرفة ---------------- */

export type CardArt = 'siraj' | 'siraj-wave' | { icon: SirajIconName }

export type Card =
  | {
      kind: 'fact'
      id: string
      title?: string
      body: string
      /** a word the learner can tap to reveal its meaning */
      term?: { word: string; meaning: string }
      art?: CardArt
    }
  | {
      kind: 'quote'
      id: string
      /** آية or حديث - rendered in the reverent quote style */
      of: 'ayah' | 'hadith'
      text: string
      source: string
      note?: string
    }
  | {
      kind: 'list'
      id: string
      title: string
      items: { icon?: SirajIconName; label: string; note?: string }[]
    }

/* ---------------- practice phase: التمارين ---------------- */

export interface ChoiceExercise {
  kind: 'choice'
  id: string
  prompt: string
  options: { id: string; label: string }[]
  answerId: string
  explain?: string
}

export interface BooleanExercise {
  kind: 'boolean'
  id: string
  prompt?: string
  statement: string
  answer: boolean
  explain?: string
}

export interface OrderExercise {
  kind: 'order'
  id: string
  prompt: string
  items: { id: string; label: string }[]
  /** item ids in the correct sequence */
  answer: string[]
  explain?: string
}

export interface MatchExercise {
  kind: 'match'
  id: string
  prompt: string
  pairs: { id: string; left: string; right: string }[]
  explain?: string
}

export interface SortExercise {
  kind: 'sort'
  id: string
  prompt: string
  buckets: [{ id: string; label: string }, { id: string; label: string }]
  items: { id: string; label: string; bucket: string }[]
  explain?: string
}

export type Exercise =
  | ChoiceExercise
  | BooleanExercise
  | OrderExercise
  | MatchExercise
  | SortExercise

export type ExerciseKind = Exercise['kind']

/* ---------------- اسأل سراج ---------------- */

export interface AskSuggestion {
  q: string
  /** the pre-written answer used until a live model is wired in */
  a: string
}

/* ---------------- a lesson = one step on the stair ---------------- */

export interface Lesson {
  id: string
  title: string
  subtitle?: string
  icon: SirajIconName
  cards: Card[]
  exercises: Exercise[]
  ask: AskSuggestion[]
  xp: number
}

/* ---------------- the path ---------------- */

export type NodeKind = 'lesson' | 'chest' | 'trophy'

export interface PathNode {
  id: string
  unitId: string
  kind: NodeKind
  lessonId?: string
  label?: string
  /** content not written yet - shows as a "قريبًا" step on the stair */
  soon?: boolean
}

export type UnitTone = 'gold' | 'ember' | 'deep' | 'sand'

export interface Unit {
  id: string
  index: number
  title: string
  subtitle: string
  icon: SirajIconName
  tone: UnitTone
  nodes: PathNode[]
}

/* ---------------- progress ---------------- */

export interface Settings {
  sound: boolean
  haptics: boolean
  reduceMotion: boolean
  theme: 'auto' | 'light' | 'dark'
}

export interface NodeResult {
  stars: number
  bestAccuracy: number
  at: number
}

export interface Progress {
  version: 1
  onboarded: boolean
  name: string | null
  language: string
  xp: number
  streak: number
  /** YYYY-MM-DD of the last day a lesson was finished */
  lastActiveDay: string | null
  oil: number
  oilUpdatedAt: number
  completed: Record<string, NodeResult>
  achievements: string[]
  settings: Settings
}
