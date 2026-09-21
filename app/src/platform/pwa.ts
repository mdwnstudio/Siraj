import { registerSW } from 'virtual:pwa-register'

/* Service worker + update policy.

   A new deploy installs in the background and waits. It takes over when:
   - every window of the app has closed (the next cold launch is fresh), or
   - the learner comes back after a long break (AWAY_MS), where a quick
     reload through the splash reads as a relaunch, not a lost lesson.
   We never reload while someone is mid-step. */

const AWAY_MS = 10 * 60 * 1000
const CHECK_MS = 30 * 60 * 1000

export function startPwa() {
  if (!('serviceWorker' in navigator) || import.meta.env.DEV) return

  let waiting = false
  let hiddenAt = 0
  let lastCheck = Date.now()
  let reg: ServiceWorkerRegistration | undefined

  const update = registerSW({
    onRegisteredSW(_url, r) {
      reg = r
    },
    onNeedRefresh() {
      waiting = true
    },
  })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now()
      return
    }
    const away = hiddenAt && Date.now() - hiddenAt > AWAY_MS
    if (waiting && away) {
      void update(true)
      return
    }
    // an installed app can live for days; look for a new deploy on return
    if (reg && Date.now() - lastCheck > CHECK_MS) {
      lastCheck = Date.now()
      void reg.update().catch(() => {})
    }
  })
}
