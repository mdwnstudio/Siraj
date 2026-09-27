import { useSyncExternalStore } from 'react'
import { removeChat, upsertChat, type SavedChat } from '../core/ai/chats'
import { webChatStore } from '../platform/webStorage'

/* One copy of the saved chats for the whole app, so the history sheet and
   the chat on screen always agree. Read once, written through on change. */

let chats: SavedChat[] | null = null
/** the chat last open on the Ask tab, so coming back to the tab finds it */
let openId: string | null = null
const subs = new Set<() => void>()

function all(): SavedChat[] {
  return (chats ??= webChatStore.load())
}

function commit(next: SavedChat[]) {
  chats = next
  webChatStore.save(next)
  subs.forEach((f) => f())
}

export const chatStore = {
  all,
  get: (id: string) => all().find((c) => c.id === id),
  put: (c: SavedChat) => commit(upsertChat(all(), c)),
  remove: (id: string) => commit(removeChat(all(), id)),
  clear: () => { webChatStore.clear(); openId = null; commit([]) },
  open: () => openId,
  setOpen: (id: string | null) => { openId = id },
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }

export function useChats(): SavedChat[] {
  return useSyncExternalStore(subscribe, all, all)
}
