import { useSyncExternalStore } from 'react'

/* Three shapes of the same app, picked by viewport width:
   phone   - one column, bottom tab bar (the original design)
   tablet  - an icon rail on the side, stats stay on top
   desktop - a full sidebar, the content, and a rail of cards
   Keep these in step with the @media breakpoints in app.css. */
export type Layout = 'phone' | 'tablet' | 'desktop'

const TABLET = '(min-width: 700px)'
const DESKTOP = '(min-width: 1100px)'

function read(): Layout {
  if (typeof window === 'undefined' || !window.matchMedia) return 'phone'
  if (window.matchMedia(DESKTOP).matches) return 'desktop'
  if (window.matchMedia(TABLET).matches) return 'tablet'
  return 'phone'
}

function subscribe(cb: () => void) {
  const queries = [TABLET, DESKTOP].map((q) => window.matchMedia(q))
  queries.forEach((m) => m.addEventListener('change', cb))
  return () => queries.forEach((m) => m.removeEventListener('change', cb))
}

export function useLayout(): Layout {
  return useSyncExternalStore(subscribe, read, () => 'phone')
}
