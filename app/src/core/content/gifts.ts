/* ============================================================
   GIFTS: something extra waiting on the stair after a lesson.
   Finish the step and, back on the stair, a wrapped gift appears;
   opening it shows what is inside. Once opened it can be watched
   again from that step's sheet. Pure data, no DOM.
   ============================================================ */

import type { Progress } from '../types'
import { UNIT_OF } from './path'

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

/** A gift the learner has earned and not opened yet, to bring up on the
 *  stair. Only while they still stand in the unit that earned it: one
 *  raced past used to pop up units later, out of nowhere, on the next
 *  visit. Past that unit it waits in its step's sheet instead. */
export function giftWaiting(p: Progress, currentNode: string): Gift | undefined {
  const unit = UNIT_OF.get(currentNode)
  return GIFTS.find((g) => p.completed[g.afterNode] && !p.gifts.includes(g.id) && UNIT_OF.get(g.afterNode) === unit)
}

/** the gift a finished step earned, opened or not */
export function giftOf(p: Progress, nodeId: string): { gift: Gift; opened: boolean } | undefined {
  const gift = GIFTS.find((g) => g.afterNode === nodeId && p.completed[nodeId])
  return gift && { gift, opened: p.gifts.includes(gift.id) }
}

export function isGiftId(v: unknown): v is string {
  return GIFTS.some((g) => g.id === v)
}
