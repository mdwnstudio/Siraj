import {
  createContext, useContext, useEffect, useMemo, useReducer, useRef, useSyncExternalStore, type ReactNode,
} from 'react'
import type { Progress, Settings } from '../core/types'
import { webStore } from '../platform/webStorage'
import { applyLesson, claimReward, grantAchievement, type LessonOutcome, type ApplyResult } from '../core/engine/progress'
import { setSound } from '../platform/sound'
import { setHaptics } from '../platform/haptics'

type Action =
  | { type: 'hydrate'; progress: Progress }
  | { type: 'onboard'; name: string | null; language: string; gender: Progress['gender']; avatar: string | null }
  | { type: 'profile'; patch: Partial<Pick<Progress, 'name' | 'gender' | 'avatar' | 'banner'>> }
  | { type: 'finish-lesson'; outcome: LessonOutcome }
  | { type: 'claim-reward'; nodeId: string }
  | { type: 'grant'; id: string }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'reset' }
  | { type: 'set'; progress: Progress }

function reducer(state: Progress, action: Action): Progress {
  switch (action.type) {
    case 'hydrate':
    case 'set':
      return action.progress
    case 'onboard':
      return { ...state, onboarded: true, name: action.name, language: action.language, gender: action.gender, avatar: action.avatar }
    case 'profile':
      return { ...state, ...action.patch }
    case 'finish-lesson':
      return applyLesson(state, action.outcome).progress
    case 'claim-reward':
      return claimReward(state, action.nodeId)
    case 'grant':
      return grantAchievement(state, action.id)
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'reset':
      return { ...webStore.load(), onboarded: false }
  }
}

interface Ctx {
  progress: Progress
  dispatch: (a: Action) => void
  /** finish a lesson and get back what to celebrate */
  finishLesson: (o: LessonOutcome) => ApplyResult
}

const AppCtx = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [progress, dispatch] = useReducer(reducer, null, () => webStore.load())
  const latest = useRef(progress)
  latest.current = progress

  // persist (cheap: the object is small and writes are rare)
  useEffect(() => {
    webStore.save(progress)
  }, [progress])

  // mirror settings into the platform adapters
  useEffect(() => {
    setSound(progress.settings.sound)
    setHaptics(progress.settings.haptics)
  }, [progress.settings.sound, progress.settings.haptics])

  // theme
  useEffect(() => {
    const t = progress.settings.theme
    const root = document.documentElement
    // index.html ships data-theme="light" so the first paint is never dark;
    // 'auto' clears it and hands control back to prefers-color-scheme.
    if (t === 'auto') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', t)
  }, [progress.settings.theme])

  const value = useMemo<Ctx>(
    () => ({
      progress,
      dispatch,
      finishLesson(o) {
        const result = applyLesson(latest.current, o)
        dispatch({ type: 'set', progress: result.progress })
        return result
      },
    }),
    [progress],
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp(): Ctx {
  const c = useContext(AppCtx)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}

export function useProgress(): Progress {
  return useApp().progress
}

/* one shared media query, read on change rather than on every render */
const REDUCE = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : undefined
const subscribeReduce = (cb: () => void) => {
  REDUCE?.addEventListener('change', cb)
  return () => REDUCE?.removeEventListener('change', cb)
}
const osReduced = () => !!REDUCE?.matches

const DARK = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : undefined
const subscribeDark = (cb: () => void) => {
  DARK?.addEventListener('change', cb)
  return () => DARK?.removeEventListener('change', cb)
}
const osDark = () => !!DARK?.matches

/** true when the user asked for less motion, from either the OS or settings */
export function useCalmMotion(): boolean {
  const { settings } = useProgress()
  const os = useSyncExternalStore(subscribeReduce, osReduced, () => false)
  return settings.reduceMotion || os
}

/** Resolve the setting and OS preference once for bitmap artwork selection. */
export function useDarkTheme(): boolean {
  const { settings } = useProgress()
  const os = useSyncExternalStore(subscribeDark, osDark, () => false)
  return settings.theme === 'dark' || (settings.theme === 'auto' && os)
}
