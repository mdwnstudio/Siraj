import { useSyncExternalStore } from 'react'

/* Two render tiers of the same design.
   full - everything as drawn.
   lite - every screen, transition and colour stays, but the things a weak
          GPU pays for on every scrolled frame go: masked layers over moving
          content, per-layer parallax, backdrop blur, and half the particles.
   The tier is picked at boot from what the device says about itself, and a
   device that still drops frames on the stair is moved to lite for good.
   It shows as `html.lite`, so CSS and JS read the same switch. */

const KEY = 'siraj.lite'

type Nav = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }

function detect(): boolean {
  if (typeof navigator === 'undefined') return false
  try {
    if (localStorage.getItem(KEY) === '1') return true
  } catch { /* private mode: fall through to the hints */ }
  const nav = navigator as Nav
  if (nav.connection?.saveData) return true
  // Chrome reports memory in steps (0.5, 1, 2, 4, 8); 2GB and under is a budget phone
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return true
  if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) return true
  return false
}

let lite = detect()
const listeners = new Set<() => void>()

function apply() {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('lite', lite)
}
apply()

export function isLite(): boolean {
  return lite
}

function goLite() {
  if (lite) return
  lite = true
  try { localStorage.setItem(KEY, '1') } catch { /* keep it for this session only */ }
  apply()
  listeners.forEach((l) => l())
}

export function useLite(): boolean {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb) } },
    isLite,
    () => false,
  )
}

/* The jank watch. Fed one timestamp per painted scroll frame; a gap of more
   than 100ms is a pause between flicks and does not count. If over a stretch
   of scrolling a third of the frames arrive late (two refreshes or more at
   60Hz), the device cannot hold full, and lite takes over. */
const WINDOW = 90
let last = 0
let seen = 0
let late = 0

export function sampleScrollFrame(now: number) {
  if (lite) return
  const gap = now - last
  last = now
  if (gap > 100) return
  seen++
  if (gap > 30) late++
  if (seen < WINDOW) return
  if (late / seen > 1 / 3) goLite()
  seen = 0
  late = 0
}
