/* ============================================================
   GIFTS: something extra waiting on the stair after a lesson.
   Finish the step and, back on the stair, a wrapped gift appears;
   opening it shows what is inside. Once opened it can be watched
   again from that step's sheet. Pure data, no DOM.
   ============================================================ */

import type { Progress } from '../types'

export interface Gift {
  id: string
  /** the step whose completion unwraps it */
  afterNode: string
  /** a YouTube video id, played from youtube-nocookie.com */
  youtube: string
  title: { ar: string; en: string }
  note: { ar: string; en: string }
}

export const GIFTS: Gift[] = [
  {
    id: 'g-salah-video',
    afterNode: 'n-salah-3',
    youtube: 'SKQ4wPM_nOA',
    title: { ar: 'شاهد الصلاة كاملة', en: 'Watch the whole prayer' },
    note: {
      ar: 'الشيخ د. عثمان الخميس يصلّي أربع ركعاتٍ صلاةً تعليمية، فترى فيها ما تعلّمته في هذا الدرس.',
      en: 'Sheikh Dr. Othman Al-Khamees prays four rak\'ahs as a lesson, so you can see what you learned here. The video is in Arabic, but you can follow each step.',
    },
  },
]

/** a gift the learner has earned and not opened yet, if any */
export function giftWaiting(p: Progress): Gift | undefined {
  return GIFTS.find((g) => p.completed[g.afterNode] && !p.gifts.includes(g.id))
}

/** the gift a step unwrapped, once it has been opened */
export function giftOf(p: Progress, nodeId: string): Gift | undefined {
  return GIFTS.find((g) => g.afterNode === nodeId && p.gifts.includes(g.id))
}

export function isGiftId(v: unknown): v is string {
  return GIFTS.some((g) => g.id === v)
}
