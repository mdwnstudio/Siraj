import type { Progress } from './types'
import { defaultProgress } from './engine/progress'
import { isAvatarId, isBannerId, isGender } from './content/avatars'

/** The only thing core/ knows about persistence. Web fulfils this with
 *  localStorage; React Native fulfils it with AsyncStorage or MMKV. */
export interface Store {
  load(): Progress
  save(p: Progress): void
  clear(): void
}

export const STORAGE_KEY = 'siraj.progress.v1'

/** Shared by every platform: never trust what comes out of storage. */
export function reviveProgress(raw: string | null): Progress {
  const base = defaultProgress()
  if (!raw) return base
  try {
    const parsed = JSON.parse(raw) as Partial<Progress>
    if (!parsed || typeof parsed !== 'object') return base
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      completed: parsed.completed ?? {},
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      gender: isGender(parsed.gender) ? parsed.gender : null,
      avatar: isAvatarId(parsed.avatar) ? parsed.avatar : null,
      banner: isBannerId(parsed.banner) ? parsed.banner : base.banner,
      version: 1,
    }
  } catch {
    return base
  }
}
