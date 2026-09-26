import {
  createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useSyncExternalStore, type ReactNode,
} from 'react'
import type { Progress, Settings } from '../core/types'
import { detectLang, type Lang } from '../core/i18n'
import { STORAGE_KEY } from '../core/storage'
import { webStore } from '../platform/webStorage'
import { STRINGS, type Strings } from './strings'
import { loadLessons } from '../core/content/lessons'
import { applyLesson, claimReward, grantAchievement, type LessonOutcome, type ApplyResult } from '../core/engine/progress'
import { setSound } from '../platform/sound'
import { setHaptics } from '../platform/haptics'

type Action =
  | { type: 'hydrate'; progress: Progress }
  | { type: 'onboard'; name: string | null; gender: Progress['gender']; avatar: string | null }
  | { type: 'language'; lang: Lang }
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
      return { ...state, onboarded: true, name: action.name, gender: action.gender, avatar: action.avatar }
    case 'language':
      // only the language changes: xp, streak and every finished step stay
      return { ...state, language: action.lang }
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

/** Saved progress, or on a first visit a fresh start in the device's
 *  language: an English phone opens in English, everything else in Arabic.
 *  Only a first visit is detected; after that the learner's choice stands. */
function boot(): Progress {
  const p = webStore.load()
  let saved = false
  try { saved = localStorage.getItem(STORAGE_KEY) !== null } catch { /* no storage: a first visit every time */ }
  if (!saved && typeof navigator !== 'undefined') p.language = detectLang(navigator.languages ?? [navigator.language])
  return p
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [progress, dispatch] = useReducer(reducer, null, boot)
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

  // the document speaks the learner's language. The frame stays dir="rtl"
  // (layout never mirrors); lang="en" is what turns the text itself LTR,
  // see section 16 of app.css.
  useEffect(() => {
    const root = document.documentElement
    root.lang = progress.language
    document.title = progress.language === 'en' ? 'Siraj - Learn Islam' : 'سراج - تعلّم الإسلام'
  }, [progress.language])

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

export function useLang(): Lang {
  return useApp().progress.language
}

/** Switch language, keeping all progress. The lessons for that language
 *  are fetched first, so nothing ever shows half translated. */
export function useSetLanguage(): (lang: Lang) => Promise<void> {
  const { dispatch } = useApp()
  return useCallback((lang: Lang) => loadLessons(lang).then(() => dispatch({ type: 'language', lang })), [dispatch])
}

/** every interface string, in the learner's language */
export function useT(): Strings {
  return STRINGS[useApp().progress.language]
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
