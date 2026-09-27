/* ============================================================
   What Siraj knows about where the learner is. Pure, no DOM.

   Built from the curriculum itself, never typed by hand, so it
   cannot drift from what the cards teach: the current lesson's
   concepts, the lesson before it and the one after it, and the
   whole course as a map of units, so Siraj can say "we cover
   that in the fasting unit".

   The server builds the same context from the lesson id alone
   (server/chatHandler.ts), so a client cannot slip its own text
   into the system prompt.
   ============================================================ */

import type { Lang, Lesson } from '../types'
import { PATH, UNITS, UNIT_OF, unitText } from '../content/path'
import { GENERAL, type SubjectId } from './chats'
import { conceptsFromLesson, type AskContext, type LessonBrief } from './systemPrompt'

export type LessonLookup = (id: string) => Lesson | undefined

/** concepts per neighbouring lesson: enough to place it, small enough to stay cheap */
const NEIGHBOUR_CONCEPTS = 10

const GENERAL_TITLE: Record<Lang, { unit: string; lesson: string }> = {
  ar: { unit: 'الرحلة كلّها', lesson: 'أركان الإسلام الخمسة' },
  en: { unit: 'The whole journey', lesson: 'The five pillars of Islam' },
}

/** the lessons on the stair, in the order they are climbed */
export function lessonNodes() {
  return PATH.filter((n) => n.kind === 'lesson' && n.lessonId && !n.soon)
}

export function isSubject(id: string, look: LessonLookup): boolean {
  return id === GENERAL || !!look(id)
}

export function courseOutline(lang: Lang, look: LessonLookup): { unit: string; lessons: string[] }[] {
  return UNITS.map((u) => ({
    unit: unitText(u, lang).title,
    lessons: u.nodes
      .filter((n) => n.lessonId && !n.soon)
      .map((n) => look(n.lessonId!)?.title)
      .filter((t): t is string => !!t),
  }))
}

function brief(lessonId: string, nodeId: string, lang: Lang, look: LessonLookup): LessonBrief | undefined {
  const l = look(lessonId)
  const u = UNIT_OF.get(nodeId)
  if (!l || !u) return undefined
  return { title: l.title, unitTitle: unitText(u, lang).title, concepts: conceptsFromLesson(l.cards).slice(0, NEIGHBOUR_CONCEPTS) }
}

export function buildAskContext(subject: SubjectId, lang: Lang, look: LessonLookup): AskContext {
  const outline = courseOutline(lang, look)
  const nodes = lessonNodes()
  const at = nodes.findIndex((n) => n.lessonId === subject)
  const lesson = at >= 0 ? look(subject) : undefined

  if (!lesson) {
    // the whole course: every lesson is in scope, none is the focus
    return {
      lessonId: GENERAL,
      unitTitle: GENERAL_TITLE[lang].unit,
      lessonTitle: GENERAL_TITLE[lang].lesson,
      taughtConcepts: outline.flatMap((u) => u.lessons),
      outline,
      lang,
    }
  }

  const node = nodes[at]
  const prev = nodes[at - 1]
  const next = nodes[at + 1]
  return {
    lessonId: subject,
    unitTitle: unitText(UNIT_OF.get(node.id)!, lang).title,
    lessonTitle: lesson.title,
    taughtConcepts: conceptsFromLesson(lesson.cards),
    prev: prev ? brief(prev.lessonId!, prev.id, lang, look) : undefined,
    next: next ? brief(next.lessonId!, next.id, lang, look) : undefined,
    outline,
    lang,
  }
}
