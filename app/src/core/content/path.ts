import type { Unit } from '../types'

/* ============================================================
   THE STAIR - الدرج
   Read bottom to top. node[0] is the lowest step; the learner
   climbs. The whole road, all five pillars, is visible from the
   first step. That visibility is the whole point of the stair
   metaphor. A node marked `soon` shows as a locked "قريبًا" step.
   ============================================================ */

export const UNITS: Unit[] = [
  {
    id: 'u-intro',
    index: 0,
    title: 'البداية',
    subtitle: 'ما هو الإسلام؟',
    icon: 'Sun',
    tone: 'gold',
    nodes: [
      { id: 'n-intro-1', unitId: 'u-intro', kind: 'lesson', lessonId: 'l-intro-1' },
      { id: 'n-intro-2', unitId: 'u-intro', kind: 'lesson', lessonId: 'l-intro-2' },
      { id: 'n-intro-3', unitId: 'u-intro', kind: 'lesson', lessonId: 'l-intro-3' },
      { id: 'n-intro-chest', unitId: 'u-intro', kind: 'chest', label: 'صندوق' },
    ],
  },
  {
    id: 'u-shahada',
    index: 1,
    title: 'الشهادتان',
    subtitle: 'الركن الأول',
    icon: 'Star',
    tone: 'ember',
    nodes: [
      { id: 'n-shahada-1', unitId: 'u-shahada', kind: 'lesson', lessonId: 'l-shahada-1' },
      { id: 'n-shahada-2', unitId: 'u-shahada', kind: 'lesson', lessonId: 'l-shahada-2' },
      { id: 'n-shahada-chest', unitId: 'u-shahada', kind: 'chest', label: 'صندوق' },
    ],
  },
  {
    id: 'u-salah',
    index: 2,
    title: 'إقام الصلاة',
    subtitle: 'الركن الثاني',
    icon: 'Sun',
    tone: 'gold',
    nodes: [
      /* الوضوء قبل الصلاة: the wudu lesson comes first on the stair */
      { id: 'n-salah-1', unitId: 'u-salah', kind: 'lesson', lessonId: 'l-salah-2' },
      { id: 'n-salah-2', unitId: 'u-salah', kind: 'lesson', lessonId: 'l-salah-1' },
      { id: 'n-salah-trophy', unitId: 'u-salah', kind: 'trophy', label: 'إنجاز' },
    ],
  },
  {
    id: 'u-zakah',
    index: 3,
    title: 'الزكاة',
    subtitle: 'الركن الثالث',
    icon: 'Droplet',
    tone: 'sand',
    nodes: [
      { id: 'n-zakah-1', unitId: 'u-zakah', kind: 'lesson', lessonId: 'l-zakah-1' },
      { id: 'n-zakah-2', unitId: 'u-zakah', kind: 'lesson', lessonId: 'l-zakah-2' },
      { id: 'n-zakah-chest', unitId: 'u-zakah', kind: 'chest', label: 'صندوق' },
    ],
  },
  {
    id: 'u-sawm',
    index: 4,
    title: 'الصوم',
    subtitle: 'الركن الرابع',
    icon: 'Crescent',
    tone: 'deep',
    nodes: [
      { id: 'n-sawm-1', unitId: 'u-sawm', kind: 'lesson', lessonId: 'l-sawm-1' },
      { id: 'n-sawm-2', unitId: 'u-sawm', kind: 'lesson', lessonId: 'l-sawm-2' },
      { id: 'n-sawm-chest', unitId: 'u-sawm', kind: 'chest', label: 'صندوق' },
    ],
  },
  {
    id: 'u-hajj',
    index: 5,
    title: 'الحج',
    subtitle: 'الركن الخامس',
    icon: 'Lantern',
    tone: 'ember',
    nodes: [
      { id: 'n-hajj-1', unitId: 'u-hajj', kind: 'lesson', lessonId: 'l-hajj-1' },
      { id: 'n-hajj-2', unitId: 'u-hajj', kind: 'lesson', lessonId: 'l-hajj-2' },
      { id: 'n-hajj-trophy', unitId: 'u-hajj', kind: 'trophy', label: 'الختام' },
    ],
  },
]

/** the whole stair, flattened bottom → top */
export const PATH = UNITS.flatMap((u) => u.nodes)

export const NODE_INDEX = new Map(PATH.map((n, i) => [n.id, i]))
export const UNIT_OF = new Map(UNITS.flatMap((u) => u.nodes.map((n) => [n.id, u] as const)))

export function unitById(id: string) {
  return UNITS.find((u) => u.id === id)
}
