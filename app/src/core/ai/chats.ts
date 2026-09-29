/* ============================================================
   Saved chats with Siraj. Pure, no DOM: the web keeps them in
   localStorage (platform/webStorage.ts), a native port in
   AsyncStorage or MMKV, behind the same ChatStore interface.

   A chat saves itself as each message completes, the way modern
   chat apps do: there is no save button, and closing the app
   never loses a reply. Chats never leave the device.
   ============================================================ */

import type { Lang } from '../i18n'
import { isLang } from '../i18n'

/** the subject a chat is about: a lesson id, or the whole course */
export const GENERAL = 'general'
export type SubjectId = string

export interface ChatMsg {
  who: 'me' | 'siraj'
  text: string
  sources?: { title: string; url: string }[]
  /** the server's signature on a live reply, sent back with the history
   *  so the server can tell its own words from edited ones */
  sig?: string
  /** where a reply came from, shown under it (transparency): written by
   *  the AI just now, or one of the bundled answers prepared in advance */
  origin?: ReplyOrigin
}

export type ReplyOrigin = 'ai' | 'prepared'

export interface SavedChat {
  id: string
  subject: SubjectId
  lang: Lang
  /** the first question, shortened: a name the learner recognises */
  title: string
  created: number
  updated: number
  msgs: ChatMsg[]
}

export interface ChatStore {
  load(): SavedChat[]
  save(chats: SavedChat[]): void
  clear(): void
}

export const CHATS_KEY = 'siraj.chats.v1'
export const MAX_CHATS = 40
export const MAX_MSGS = 80

export function newChatId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function chatTitle(firstQuestion: string): string {
  const q = firstQuestion.replace(/\s+/g, ' ').trim()
  return q.length > 60 ? q.slice(0, 58).trimEnd() + '…' : q
}

/** put a chat at the top of the list (newest activity first) */
export function upsertChat(list: SavedChat[], chat: SavedChat): SavedChat[] {
  const trimmed = { ...chat, msgs: chat.msgs.slice(-MAX_MSGS) }
  return [trimmed, ...list.filter((c) => c.id !== chat.id)].slice(0, MAX_CHATS)
}

export function removeChat(list: SavedChat[], id: string): SavedChat[] {
  return list.filter((c) => c.id !== id)
}

/** Today / yesterday / this week / earlier, by last activity, like the
 *  history lists of ChatGPT and Claude. */
export type ChatAge = 'today' | 'yesterday' | 'week' | 'older'

export function chatAge(updated: number, now = Date.now()): ChatAge {
  const day = (t: number) => {
    const d = new Date(t)
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000
  }
  const gap = day(now) - day(updated)
  if (gap <= 0) return 'today'
  if (gap === 1) return 'yesterday'
  if (gap < 7) return 'week'
  return 'older'
}

/** Never trust what comes out of storage. */
export function reviveChats(raw: string | null): SavedChat[] {
  if (!raw) return []
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return [] }
  if (!Array.isArray(parsed)) return []
  const out: SavedChat[] = []
  for (const c of parsed) {
    if (!c || typeof c !== 'object') continue
    const r = c as Record<string, unknown>
    if (typeof r.id !== 'string' || typeof r.subject !== 'string' || !isLang(r.lang) || !Array.isArray(r.msgs)) continue
    const msgs: ChatMsg[] = []
    for (const m of r.msgs) {
      if (!m || typeof m !== 'object') continue
      const mm = m as Record<string, unknown>
      if ((mm.who !== 'me' && mm.who !== 'siraj') || typeof mm.text !== 'string') continue
      msgs.push({
        who: mm.who,
        text: mm.text,
        sources: Array.isArray(mm.sources)
          ? (mm.sources as unknown[]).filter((s): s is { title: string; url: string } =>
              !!s && typeof (s as { url?: unknown }).url === 'string' && typeof (s as { title?: unknown }).title === 'string')
          : undefined,
        sig: typeof mm.sig === 'string' ? mm.sig : undefined,
        // a reply saved before origins were kept: only a signed one is known
        // to be the AI's; an unsigned one is left unlabelled, never guessed
        origin: mm.origin === 'ai' || mm.origin === 'prepared' ? mm.origin
          : mm.who === 'siraj' && typeof mm.sig === 'string' ? 'ai' : undefined,
      })
    }
    if (!msgs.length) continue
    out.push({
      id: r.id,
      subject: r.subject,
      lang: r.lang,
      title: typeof r.title === 'string' && r.title ? r.title : chatTitle(msgs[0].text),
      created: typeof r.created === 'number' ? r.created : 0,
      updated: typeof r.updated === 'number' ? r.updated : 0,
      msgs: msgs.slice(-MAX_MSGS),
    })
  }
  return out.sort((a, b) => b.updated - a.updated).slice(0, MAX_CHATS)
}
