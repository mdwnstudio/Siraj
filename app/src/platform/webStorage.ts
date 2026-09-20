import type { Store } from '../core/storage'
import { STORAGE_KEY, reviveProgress } from '../core/storage'
import type { Progress } from '../core/types'

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
