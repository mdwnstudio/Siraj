import type { Store } from '../core/storage'
import { STORAGE_KEY, reviveProgress } from '../core/storage'
import type { Progress } from '../core/types'
import { CHATS_KEY, reviveChats, type ChatStore, type SavedChat } from '../core/ai/chats'

/** Web implementation of core's Store. Swap this file for AsyncStorage
 *  on React Native; nothing under core/ changes. */
export const webStore: Store = {
  load(): Progress {
    try {
      return reviveProgress(localStorage.getItem(STORAGE_KEY))
    } catch {
      // private mode, blocked site data, quota - play anyway, just don't persist
      return reviveProgress(null)
    }
  },
  save(p: Progress) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* non-fatal */
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* non-fatal */
    }
  },
}

/** Saved chats with Siraj, beside progress but under their own key, so a
 *  long chat history never slows the progress save that runs on every tap. */
export const webChatStore: ChatStore = {
  load(): SavedChat[] {
    try {
      return reviveChats(localStorage.getItem(CHATS_KEY))
    } catch {
      return []
    }
  },
  save(chats: SavedChat[]) {
    try {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
    } catch {
      /* quota or private mode: the chat still works, it just is not kept */
    }
  },
  clear() {
    try {
      localStorage.removeItem(CHATS_KEY)
    } catch {
      /* non-fatal */
    }
  },
}
